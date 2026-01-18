using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Distributed;
using System.Net;
using System.Text.Json;

namespace NFK.Infrastructure.Middleware;

/// <summary>
/// Rate limiting middleware to prevent abuse and brute force attacks
/// </summary>
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IDistributedCache _cache;
    
    // Rate limit configurations
    private const int LoginAttempts = 5;
    private const int LoginWindowMinutes = 15;
    private const int ApiRequestsPerMinute = 100;
    private const int DocumentDownloadsPerHour = 50;
    
    public RateLimitingMiddleware(RequestDelegate next, IDistributedCache cache)
    {
        _next = next;
        _cache = cache;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.Request.Path.Value?.ToLower() ?? "";
        var clientId = GetClientIdentifier(context);
        
        // Apply different limits based on endpoint
        if (endpoint.Contains("/api/v1/auth/login"))
        {
            if (!await CheckRateLimitAsync($"login:{clientId}", LoginAttempts, LoginWindowMinutes * 60))
            {
                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    error = "Too many login attempts. Please try again later.",
                    retryAfter = LoginWindowMinutes * 60
                }));
                return;
            }
        }
        else if (endpoint.Contains("/api/v1/documents") && endpoint.Contains("/download"))
        {
            if (!await CheckRateLimitAsync($"download:{clientId}", DocumentDownloadsPerHour, 3600))
            {
                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    error = "Download limit exceeded. Please try again later.",
                    retryAfter = 3600
                }));
                return;
            }
        }
        else if (endpoint.StartsWith("/api/v1/"))
        {
            if (!await CheckRateLimitAsync($"api:{clientId}", ApiRequestsPerMinute, 60))
            {
                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    error = "Rate limit exceeded. Please slow down.",
                    retryAfter = 60
                }));
                return;
            }
        }
        
        await _next(context);
    }
    
    private string GetClientIdentifier(HttpContext context)
    {
        // Use user ID if authenticated, otherwise use IP address
        var userId = context.User?.Identity?.IsAuthenticated == true
            ? context.User.FindFirst("sub")?.Value ?? context.User.FindFirst("userId")?.Value
            : null;
        
        if (userId != null)
            return $"user:{userId}";
        
        // Get IP address (consider X-Forwarded-For in production behind proxy)
        var ipAddress = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? context.Connection.RemoteIpAddress?.ToString()
            ?? "unknown";
        
        return $"ip:{ipAddress}";
    }
    
    private async Task<bool> CheckRateLimitAsync(string key, int maxRequests, int windowSeconds)
    {
        var cacheKey = $"ratelimit:{key}";
        
        try
        {
            var currentCount = await _cache.GetStringAsync(cacheKey);
            var count = string.IsNullOrEmpty(currentCount) ? 0 : int.Parse(currentCount);
            
            if (count >= maxRequests)
            {
                return false;
            }
            
            count++;
            
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(windowSeconds)
            };
            
            await _cache.SetStringAsync(cacheKey, count.ToString(), options);
            
            return true;
        }
        catch (Exception ex)
        {
            // Log cache failure but allow request (fail open for availability)
            // In production: _logger.LogWarning(ex, "Rate limit cache failure for key: {Key}", key)
            Console.Error.WriteLine($"Rate limit cache error for {key}: {ex.Message}");
            return true;
        }
    }
}
