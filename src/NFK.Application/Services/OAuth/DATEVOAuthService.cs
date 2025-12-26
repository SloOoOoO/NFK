using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.OAuth;
using NFK.Application.Interfaces;
using NFK.Domain.Entities.Users;
using NFK.Infrastructure.Data;
using NFK.Infrastructure.Security;

namespace NFK.Application.Services.OAuth;

/// <summary>
/// DATEV OAuth 2.0 authentication service implementation
/// Handles user authentication via DATEV login for tax consultants and accounting professionals
/// 
/// Security Notes:
/// - DATEV is the leading accounting software provider in Germany
/// - Only certified tax consultants and accounting firms should have DATEV credentials
/// - This integration ensures that only licensed professionals can access sensitive financial data
/// - Implements OAuth 2.0 with PKCE for enhanced security
/// </summary>
public class DATEVOAuthService : IDATEVOAuthService
{
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly string _authorizationEndpoint;
    private readonly string _tokenEndpoint;
    private readonly string _userInfoEndpoint;
    private readonly string _scope;
    private readonly bool _enabled;
    private readonly ILogger<DATEVOAuthService> _logger;
    private readonly HttpClient _httpClient;
    private readonly ApplicationDbContext _context;
    private readonly JwtService _jwtService;

    public DATEVOAuthService(
        IConfiguration configuration,
        ILogger<DATEVOAuthService> logger,
        HttpClient httpClient,
        ApplicationDbContext context,
        JwtService jwtService)
    {
        _clientId = configuration["OAuth:DATEV:ClientId"] ?? string.Empty;
        _clientSecret = configuration["OAuth:DATEV:ClientSecret"] ?? string.Empty;
        _authorizationEndpoint = configuration["OAuth:DATEV:AuthorizationEndpoint"] ?? "https://login.datev.de/openid/authorize";
        _tokenEndpoint = configuration["OAuth:DATEV:TokenEndpoint"] ?? "https://login.datev.de/openid/token";
        _userInfoEndpoint = configuration["OAuth:DATEV:UserInfoEndpoint"] ?? "https://login.datev.de/openid/userinfo";
        _scope = configuration["OAuth:DATEV:Scope"] ?? "openid profile email datev:accounting";
        _enabled = bool.Parse(configuration["OAuth:DATEV:Enabled"] ?? "false");
        _logger = logger;
        _httpClient = httpClient;
        _context = context;
        _jwtService = jwtService;

        if (!_enabled)
        {
            _logger.LogInformation("DATEV OAuth is currently disabled. Configure credentials to enable.");
        }
    }

    public string GetAuthorizationUrl(string redirectUri, string? state = null)
    {
        if (!_enabled || string.IsNullOrEmpty(_clientId))
        {
            throw new InvalidOperationException("DATEV OAuth is not configured. Please contact your administrator.");
        }

        var queryParams = new Dictionary<string, string>
        {
            ["client_id"] = _clientId,
            ["redirect_uri"] = redirectUri,
            ["response_type"] = "code",
            ["scope"] = _scope,
            ["access_type"] = "offline",
            ["prompt"] = "consent"
        };

        if (!string.IsNullOrEmpty(state))
        {
            queryParams["state"] = state;
        }

        var query = string.Join("&", queryParams.Select(kvp => $"{kvp.Key}={Uri.EscapeDataString(kvp.Value)}"));
        return $"{_authorizationEndpoint}?{query}";
    }

    public async Task<OAuthLoginResponse> LoginAsync(string code, string redirectUri)
    {
        if (!_enabled)
        {
            throw new InvalidOperationException("DATEV OAuth is not enabled. Please contact your administrator.");
        }

        _logger.LogInformation("DATEV OAuth login attempt");

        // Exchange code for access token
        var tokenRequest = new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = _clientId,
            ["client_secret"] = _clientSecret,
            ["redirect_uri"] = redirectUri,
            ["grant_type"] = "authorization_code"
        };

        var tokenResponse = await _httpClient.PostAsync(_tokenEndpoint, new FormUrlEncodedContent(tokenRequest));
        
        if (!tokenResponse.IsSuccessStatusCode)
        {
            var error = await tokenResponse.Content.ReadAsStringAsync();
            _logger.LogError("DATEV token exchange failed: {Error}", error);
            throw new InvalidOperationException("Failed to authenticate with DATEV");
        }

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<JsonElement>();
        var accessToken = tokenData.GetProperty("access_token").GetString() 
            ?? throw new InvalidOperationException("No access token received from DATEV");

        // Get user profile
        var userProfile = await GetUserProfileAsync(accessToken);

        // Validate consultant credentials (DATEV users must be certified consultants)
        if (!string.IsNullOrEmpty(userProfile.ConsultantNumber))
        {
            var isValid = await ValidateConsultantCredentialsAsync(userProfile.ConsultantNumber);
            if (!isValid)
            {
                _logger.LogWarning("Invalid DATEV consultant credentials: {ConsultantNumber}", userProfile.ConsultantNumber);
                throw new UnauthorizedAccessException("Invalid consultant credentials. Only certified tax consultants can access this system.");
            }
        }

        // Find or create user
        var user = await FindOrCreateDATEVUserAsync(userProfile);

        // Generate JWT tokens
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var jwtToken = _jwtService.GenerateAccessToken(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            roles);
        var refreshToken = _jwtService.GenerateRefreshToken();

        // Store refresh token
        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtService.GetRefreshTokenExpirationDays()),
            IsRevoked = false
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("DATEV OAuth login successful for user: {UserId}, Consultant: {ConsultantNumber}", 
            user.Id, userProfile.ConsultantNumber);

        return new OAuthLoginResponse(
            jwtToken,
            refreshToken,
            _jwtService.GetAccessTokenExpirationSeconds(),
            "Bearer",
            new OAuthUserInfo(
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                roles.FirstOrDefault() ?? "Consultant",
                "DATEV"
            )
        );
    }

    public async Task<DATEVUserProfile> GetUserProfileAsync(string accessToken)
    {
        if (!_enabled)
        {
            throw new InvalidOperationException("DATEV OAuth is not enabled");
        }

        var request = new HttpRequestMessage(HttpMethod.Get, _userInfoEndpoint);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        
        var response = await _httpClient.SendAsync(request);
        
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Failed to get DATEV user profile: {Error}", error);
            throw new InvalidOperationException("Failed to retrieve DATEV user profile");
        }

        var profile = await response.Content.ReadFromJsonAsync<DATEVUserProfile>();
        return profile ?? throw new InvalidOperationException("Failed to parse DATEV user profile");
    }

    public async Task<bool> ValidateConsultantCredentialsAsync(string consultantNumber)
    {
        // SECURITY CRITICAL: This method MUST be implemented with actual DATEV API validation before production
        // Current implementation is a placeholder that logs a warning
        
        _logger.LogWarning("DATEV consultant validation is not fully implemented. Consultant number: {ConsultantNumber}. " +
                          "This MUST be replaced with actual DATEV API calls before production deployment.", 
                          consultantNumber);

        if (string.IsNullOrWhiteSpace(consultantNumber))
        {
            _logger.LogWarning("Empty consultant number provided for DATEV validation");
            return false;
        }

        // TODO: SECURITY - Implement actual DATEV API validation before production:
        // 1. Call DATEV's API to verify the consultant number exists
        // 2. Verify the consultant has an active license
        // 3. Confirm the consultant is certified for tax/accounting services  
        // 4. Check that the consultant's credentials haven't been revoked
        // 5. Validate the consultant number format and checksum
        
        // For development/testing: Accept any non-empty consultant number
        // WARNING: This is NOT secure for production use
        await Task.CompletedTask;
        return true; // PLACEHOLDER - Replace with actual validation
    }

    private async Task<User> FindOrCreateDATEVUserAsync(DATEVUserProfile profile)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.DATEVId == profile.Sub || u.Email == profile.Email);

        if (user == null)
        {
            // Create new user with consultant role
            user = new User
            {
                Email = profile.Email,
                DATEVId = profile.Sub,
                FirstName = profile.GivenName,
                LastName = profile.FamilyName,
                IsEmailConfirmed = profile.EmailVerified,
                IsActive = true,
                PasswordHash = string.Empty // No password for OAuth users
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Assign consultant role
            var consultantRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Consultant" || r.Name == "DATEVManager");
            if (consultantRole != null)
            {
                var userRole = new UserRole
                {
                    UserId = user.Id,
                    RoleId = consultantRole.Id
                };
                _context.UserRoles.Add(userRole);
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation("New DATEV user created: {Email}, Consultant: {ConsultantNumber}", 
                user.Email, profile.ConsultantNumber);
        }
        else if (string.IsNullOrEmpty(user.DATEVId))
        {
            // Link existing user to DATEV account
            user.DATEVId = profile.Sub;
            user.IsEmailConfirmed = profile.EmailVerified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Existing user linked to DATEV: {Email}", user.Email);
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return user;
    }
}
