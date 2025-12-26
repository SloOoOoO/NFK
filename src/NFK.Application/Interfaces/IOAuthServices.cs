using NFK.Application.DTOs.OAuth;

namespace NFK.Application.Interfaces;

/// <summary>
/// Service for Google OAuth authentication
/// </summary>
public interface IGoogleOAuthService
{
    /// <summary>
    /// Get the Google OAuth authorization URL for redirecting users
    /// </summary>
    /// <param name="redirectUri">The callback URL after authentication</param>
    /// <param name="state">Optional state parameter for CSRF protection</param>
    /// <returns>Authorization URL</returns>
    string GetAuthorizationUrl(string redirectUri, string? state = null);

    /// <summary>
    /// Exchange authorization code for access token and user profile
    /// </summary>
    /// <param name="code">Authorization code from Google</param>
    /// <param name="redirectUri">The same redirect URI used in authorization</param>
    /// <returns>OAuth login response with tokens and user info</returns>
    Task<OAuthLoginResponse> LoginAsync(string code, string redirectUri);

    /// <summary>
    /// Get user profile from Google using access token
    /// </summary>
    /// <param name="accessToken">Google access token</param>
    /// <returns>Google user profile</returns>
    Task<GoogleUserProfile> GetUserProfileAsync(string accessToken);
}

/// <summary>
/// Service for DATEV OAuth authentication
/// Implements OAuth 2.0 flow for DATEV integration
/// </summary>
public interface IDATEVOAuthService
{
    /// <summary>
    /// Get the DATEV OAuth authorization URL for redirecting users
    /// </summary>
    /// <param name="redirectUri">The callback URL after authentication</param>
    /// <param name="state">Optional state parameter for CSRF protection</param>
    /// <returns>Authorization URL</returns>
    string GetAuthorizationUrl(string redirectUri, string? state = null);

    /// <summary>
    /// Exchange authorization code for access token and user profile
    /// </summary>
    /// <param name="code">Authorization code from DATEV</param>
    /// <param name="redirectUri">The same redirect URI used in authorization</param>
    /// <returns>OAuth login response with tokens and user info</returns>
    Task<OAuthLoginResponse> LoginAsync(string code, string redirectUri);

    /// <summary>
    /// Get user profile from DATEV using access token
    /// </summary>
    /// <param name="accessToken">DATEV access token</param>
    /// <returns>DATEV user profile including consultant information</returns>
    Task<DATEVUserProfile> GetUserProfileAsync(string accessToken);

    /// <summary>
    /// Validate DATEV consultant credentials and permissions
    /// </summary>
    /// <param name="consultantNumber">DATEV consultant number</param>
    /// <returns>True if consultant has valid accounting/tax consulting license</returns>
    Task<bool> ValidateConsultantCredentialsAsync(string consultantNumber);
}
