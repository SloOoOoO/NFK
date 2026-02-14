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
/// Google OAuth 2.0 authentication service implementation
/// Handles user authentication via Google Sign-In
/// </summary>
public class GoogleOAuthService : IGoogleOAuthService
{
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly ILogger<GoogleOAuthService> _logger;
    private readonly HttpClient _httpClient;
    private readonly ApplicationDbContext _context;
    private readonly JwtService _jwtService;

    private const string AuthorizationEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    private const string TokenEndpoint = "https://oauth2.googleapis.com/token";
    private const string UserInfoEndpoint = "https://www.googleapis.com/oauth2/v2/userinfo";

    public GoogleOAuthService(
        IConfiguration configuration,
        ILogger<GoogleOAuthService> logger,
        HttpClient httpClient,
        ApplicationDbContext context,
        JwtService jwtService)
    {
        _clientId = configuration["OAuth:Google:ClientId"] ?? throw new InvalidOperationException("Google ClientId not configured");
        _clientSecret = configuration["OAuth:Google:ClientSecret"] ?? throw new InvalidOperationException("Google ClientSecret not configured");
        _logger = logger;
        _httpClient = httpClient;
        _context = context;
        _jwtService = jwtService;
    }

    public string GetAuthorizationUrl(string redirectUri, string? state = null)
    {
        var queryParams = new Dictionary<string, string>
        {
            ["client_id"] = _clientId,
            ["redirect_uri"] = redirectUri,
            ["response_type"] = "code",
            ["scope"] = "openid email profile",
            ["access_type"] = "offline",
            ["prompt"] = "consent"
        };

        if (!string.IsNullOrEmpty(state))
        {
            queryParams["state"] = state;
        }

        var query = string.Join("&", queryParams.Select(kvp => $"{kvp.Key}={Uri.EscapeDataString(kvp.Value)}"));
        return $"{AuthorizationEndpoint}?{query}";
    }

    public async Task<OAuthLoginResponse> LoginAsync(string code, string redirectUri)
    {
        _logger.LogInformation("Google OAuth login attempt with redirect URI: {RedirectUri}", redirectUri);

        try
        {
            // Exchange code for access token
            var tokenRequest = new Dictionary<string, string>
            {
                ["code"] = code,
                ["client_id"] = _clientId,
                ["client_secret"] = _clientSecret,
                ["redirect_uri"] = redirectUri,
                ["grant_type"] = "authorization_code"
            };

            _logger.LogDebug("Requesting access token from Google");
            var tokenResponse = await _httpClient.PostAsync(TokenEndpoint, new FormUrlEncodedContent(tokenRequest));
            
            if (!tokenResponse.IsSuccessStatusCode)
            {
                var errorContent = await tokenResponse.Content.ReadAsStringAsync();
                _logger.LogError("Failed to exchange code for token. Status: {StatusCode}, Error: {Error}", 
                    tokenResponse.StatusCode, errorContent);
                throw new InvalidOperationException($"Failed to exchange authorization code for token: {errorContent}");
            }

            var tokenData = await tokenResponse.Content.ReadFromJsonAsync<JsonElement>();
            var accessToken = tokenData.GetProperty("access_token").GetString() 
                ?? throw new InvalidOperationException("No access token received from Google");

            _logger.LogDebug("Access token received, fetching user profile");

            // Get user profile
            var userProfile = await GetUserProfileAsync(accessToken);
            _logger.LogInformation("User profile retrieved for email: {Email}", userProfile.Email);

            // Find existing user (do not create new users)
            var user = await FindGoogleUserAsync(userProfile);
            
            if (user == null)
            {
                // User does not exist - this should not happen in LoginAsync
                _logger.LogWarning("Attempted login for non-existent Google user: {Email}", userProfile.Email);
                throw new InvalidOperationException("User account not found. Please complete registration first.");
            }

            _logger.LogInformation("User authenticated: {UserId}, Email: {Email}", user.Id, user.Email);

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
            
            // Update last login time
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Google OAuth login successful for user: {UserId}", user.Id);

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
                    roles.FirstOrDefault() ?? "Client",
                    "Google"
                )
            );
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error during Google OAuth: {Message}", ex.Message);
            throw new InvalidOperationException("Failed to communicate with Google OAuth service. Please try again later.", ex);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse Google OAuth response: {Message}", ex.Message);
            throw new InvalidOperationException("Invalid response from Google OAuth service.", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during Google OAuth login: {Message}", ex.Message);
            throw;
        }
    }

    public async Task<GoogleUserProfile> GetUserProfileAsync(string accessToken)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, UserInfoEndpoint);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            
            var response = await _httpClient.SendAsync(request);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to fetch user profile. Status: {StatusCode}, Error: {Error}", 
                    response.StatusCode, errorContent);
                throw new InvalidOperationException($"Failed to retrieve user profile from Google: {errorContent}");
            }

            var profile = await response.Content.ReadFromJsonAsync<GoogleUserProfile>();
            
            if (profile == null)
            {
                _logger.LogError("Received null profile from Google");
                throw new InvalidOperationException("Failed to parse user profile from Google");
            }
            
            return profile;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error fetching Google user profile: {Message}", ex.Message);
            throw new InvalidOperationException("Failed to fetch user profile from Google. Please try again later.", ex);
        }
    }

    public async Task<bool> UserExistsAsync(string email, string googleId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.GoogleId == googleId || u.Email == email);
        return user != null;
    }

    public async Task<OAuthAuthenticationResult> AuthenticateAsync(string code, string redirectUri)
    {
        _logger.LogInformation("Google OAuth authentication attempt with redirect URI: {RedirectUri}", redirectUri);

        try
        {
            // Exchange code for access token
            var tokenRequest = new Dictionary<string, string>
            {
                ["code"] = code,
                ["client_id"] = _clientId,
                ["client_secret"] = _clientSecret,
                ["redirect_uri"] = redirectUri,
                ["grant_type"] = "authorization_code"
            };

            _logger.LogDebug("Requesting access token from Google");
            var tokenResponse = await _httpClient.PostAsync(TokenEndpoint, new FormUrlEncodedContent(tokenRequest));
            
            if (!tokenResponse.IsSuccessStatusCode)
            {
                var errorContent = await tokenResponse.Content.ReadAsStringAsync();
                _logger.LogError("Failed to exchange code for token. Status: {StatusCode}, Error: {Error}", 
                    tokenResponse.StatusCode, errorContent);
                throw new InvalidOperationException($"Failed to exchange authorization code for token: {errorContent}");
            }

            var tokenData = await tokenResponse.Content.ReadFromJsonAsync<JsonElement>();
            var accessToken = tokenData.GetProperty("access_token").GetString() 
                ?? throw new InvalidOperationException("No access token received from Google");

            _logger.LogDebug("Access token received, fetching user profile");

            // Get user profile
            var userProfile = await GetUserProfileAsync(accessToken);
            _logger.LogInformation("User profile retrieved for email: {Email}", userProfile.Email);

            // Check if user exists
            var user = await FindGoogleUserAsync(userProfile);
            
            if (user == null)
            {
                // New user - return profile for registration
                _logger.LogInformation("New Google user - needs registration: {Email}", userProfile.Email);
                return new OAuthAuthenticationResult(
                    UserExists: false,
                    Profile: userProfile,
                    LoginResponse: null
                );
            }

            // Existing user - generate tokens and return login response
            _logger.LogInformation("Existing user authenticated: {UserId}, Email: {Email}", user.Id, user.Email);

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
            
            // Update last login time
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Google OAuth login successful for user: {UserId}", user.Id);

            var loginResponse = new OAuthLoginResponse(
                jwtToken,
                refreshToken,
                _jwtService.GetAccessTokenExpirationSeconds(),
                "Bearer",
                new OAuthUserInfo(
                    user.Id,
                    user.Email,
                    user.FirstName,
                    user.LastName,
                    roles.FirstOrDefault() ?? "Client",
                    "Google"
                )
            );

            return new OAuthAuthenticationResult(
                UserExists: true,
                Profile: userProfile,
                LoginResponse: loginResponse
            );
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error during Google OAuth: {Message}", ex.Message);
            throw new InvalidOperationException("Failed to communicate with Google OAuth service. Please try again later.", ex);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse Google OAuth response: {Message}", ex.Message);
            throw new InvalidOperationException("Invalid response from Google OAuth service.", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during Google OAuth authentication: {Message}", ex.Message);
            throw;
        }
    }

    private async Task<User?> FindGoogleUserAsync(GoogleUserProfile profile)
    {
        // Find user by Google ID or email, include roles
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.GoogleId == profile.Sub || u.Email == profile.Email);

        if (user != null)
        {
            // If user exists but GoogleId is not set, link the account
            if (string.IsNullOrEmpty(user.GoogleId))
            {
                user.GoogleId = profile.Sub;
                user.IsEmailConfirmed = profile.EmailVerified;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Existing user linked to Google: {Email}", user.Email);
            }
        }

        return user;
    }

    private async Task<User> FindOrCreateGoogleUserAsync(GoogleUserProfile profile)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.GoogleId == profile.Sub || u.Email == profile.Email);

        if (user == null)
        {
            // Create new user
            user = new User
            {
                Email = profile.Email,
                GoogleId = profile.Sub,
                FirstName = profile.GivenName,
                LastName = profile.FamilyName,
                IsEmailConfirmed = profile.EmailVerified,
                IsActive = true,
                PasswordHash = string.Empty // No password for OAuth users
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("New Google user created: {Email}", user.Email);
        }
        else if (string.IsNullOrEmpty(user.GoogleId))
        {
            // Link existing user to Google account
            user.GoogleId = profile.Sub;
            user.IsEmailConfirmed = profile.EmailVerified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Existing user linked to Google: {Email}", user.Email);
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return user;
    }
}
