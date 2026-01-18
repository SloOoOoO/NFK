using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace NFK.Infrastructure.Caching;

/// <summary>
/// Redis cache service for frequently accessed data
/// </summary>
public class CacheService
{
    private readonly IDistributedCache _cache;
    
    // Cache TTL configurations (in minutes)
    public const int UserProfileTTL = 15;
    public const int DashboardStatsTTL = 5;
    public const int DocumentListTTL = 1;
    
    public CacheService(IDistributedCache cache)
    {
        _cache = cache;
    }
    
    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        try
        {
            var cached = await _cache.GetStringAsync(key);
            if (string.IsNullOrEmpty(cached))
                return null;
            
            return JsonSerializer.Deserialize<T>(cached);
        }
        catch
        {
            return null;
        }
    }
    
    public async Task SetAsync<T>(string key, T value, int ttlMinutes) where T : class
    {
        try
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(ttlMinutes)
            };
            
            var serialized = JsonSerializer.Serialize(value);
            await _cache.SetStringAsync(key, serialized, options);
        }
        catch
        {
            // Log error in production, but don't fail the operation
        }
    }
    
    public async Task RemoveAsync(string key)
    {
        try
        {
            await _cache.RemoveAsync(key);
        }
        catch
        {
            // Log error in production
        }
    }
    
    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, int ttlMinutes) where T : class
    {
        var cached = await GetAsync<T>(key);
        if (cached != null)
            return cached;
        
        var value = await factory();
        await SetAsync(key, value, ttlMinutes);
        
        return value;
    }
}
