using Microsoft.AspNetCore.Mvc;
using NFK.Application.DTOs.Auth;
using NFK.Application.Interfaces;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly IAuthService _authService;
    private readonly IConfiguration _configuration;
    private readonly IGoogleOAuthService? _googleOAuthService;
    private readonly IDATEVOAuthService? _datevOAuthService;

    public AuthController(
        ILogger<AuthController> logger, 
        IAuthService authService, 
        IConfiguration configuration,
        IGoogleOAuthService? googleOAuthService = null,
        IDATEVOAuthService? datevOAuthService = null)
    {
        _logger = logger;
        _authService = authService;
        _configuration = configuration;
        _googleOAuthService = googleOAuthService;
        _datevOAuthService = datevOAuthService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var result = await _authService.RegisterAsync(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "invalid_request", message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = "user_exists", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration failed");
            return StatusCode(500, new { error = "internal_error", message = "Registration failed" });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var result = await _authService.LoginAsync(request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = "invalid_credentials", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login failed");
            return StatusCode(500, new { error = "internal_error", message = "Login failed" });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var result = await _authService.RefreshTokenAsync(request.RefreshToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = "invalid_token", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token refresh failed");
            return StatusCode(500, new { error = "internal_error", message = "Token refresh failed" });
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
    {
        try
        {
            await _authService.LogoutAsync(request.RefreshToken);
            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Logout failed");
            return StatusCode(500, new { error = "internal_error", message = "Logout failed" });
        }
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { error = "invalid_token", message = "User not found in token" });
            }

            var user = await _authService.GetUserByIdAsync(int.Parse(userId));
            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get current user failed");
            return StatusCode(500, new { error = "internal_error", message = "Failed to get current user" });
        }
    }

    /// <summary>
    /// DATEV OAuth Login - Redirects to DATEV authorization
    /// </summary>
    [HttpGet("datev/login")]
    public IActionResult DATEVLogin()
    {
        try
        {
            var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
            var callbackUri = $"{Request.Scheme}://{Request.Host}/api/v1/auth/datev/callback";
            
            if (_datevOAuthService != null && _configuration.GetValue<bool>("OAuth:DATEV:Enabled"))
            {
                var authUrl = _datevOAuthService.GetAuthorizationUrl(callbackUri);
                return Redirect(authUrl);
            }
            
            // Fallback: Simulate OAuth flow for development
            _logger.LogWarning("DATEV OAuth not configured - using simulation mode");
            var redirectUri = $"{frontendUrl}/auth/register";
            return Redirect($"{redirectUri}?source=datev&firstName=Max&lastName=Mustermann");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DATEV login error");
            var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
            return Redirect($"{frontendUrl}/auth/login?error=datev_failed");
        }
    }

    /// <summary>
    /// DATEV OAuth Callback - Handles the OAuth callback from DATEV
    /// </summary>
    [HttpGet("datev/callback")]
    public async Task<IActionResult> DATEVCallback([FromQuery] string code)
    {
        try
        {
            var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
            
            if (_datevOAuthService != null && !string.IsNullOrEmpty(code))
            {
                var callbackUri = $"{Request.Scheme}://{Request.Host}/api/v1/auth/datev/callback";
                var profile = await _datevOAuthService.GetUserProfileAsync(code);
                
                // Redirect to registration with DATEV data pre-filled and provider ID
                var redirectUri = $"{frontendUrl}/auth/register";
                return Redirect($"{redirectUri}?source=datev&firstName={Uri.EscapeDataString(profile.GivenName)}&lastName={Uri.EscapeDataString(profile.FamilyName)}&providerId={Uri.EscapeDataString(profile.Sub)}");
            }
            
            // Fallback for development
            var devRedirectUri = $"{frontendUrl}/auth/register";
            return Redirect($"{devRedirectUri}?source=datev&firstName=Max&lastName=Mustermann");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DATEV callback error");
            var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
            return Redirect($"{frontendUrl}/auth/login?error=datev_failed");
        }
    }

    /// <summary>
    /// Google OAuth Login - Redirects to Google authorization
    /// </summary>
    [HttpGet("google/login")]
    public IActionResult GoogleLogin()
    {
        try
        {
            var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
            var callbackUri = $"{Request.Scheme}://{Request.Host}/api/v1/auth/google/callback";
            
            if (_googleOAuthService != null && _configuration.GetValue<bool>("OAuth:Google:Enabled"))
            {
                _logger.LogInformation("Initiating Google OAuth flow with callback: {CallbackUri}", callbackUri);
                var authUrl = _googleOAuthService.GetAuthorizationUrl(callbackUri);
                return Redirect(authUrl);
            }
            
            // Fallback: Simulate OAuth flow for development
            _logger.LogWarning("Google OAuth not configured - using simulation mode. Set GOOGLE_OAUTH_ENABLED=true and configure credentials.");
            var redirectUri = $"{frontendUrl}/auth/register";
            return Redirect($"{redirectUri}?source=google&email=user@example.com");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google login initialization error: {Message}", ex.Message);
            var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
            return Redirect($"{frontendUrl}/auth/login?error=google_failed&message={Uri.EscapeDataString("OAuth configuration error")}");
        }
    }

    /// <summary>
    /// Google OAuth Callback - Handles the OAuth callback from Google
    /// </summary>
    [HttpGet("google/callback")]
    public async Task<IActionResult> GoogleCallback([FromQuery] string code, [FromQuery] string? error, [FromQuery] string? error_description)
    {
        var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
        
        try
        {
            // Check for OAuth errors from Google
            if (!string.IsNullOrEmpty(error))
            {
                _logger.LogWarning("Google OAuth error: {Error} - {Description}", error, error_description);
                var errorMessage = error_description ?? error;
                return Redirect($"{frontendUrl}/auth/login?error=google_failed&message={Uri.EscapeDataString(errorMessage)}");
            }
            
            if (string.IsNullOrEmpty(code))
            {
                _logger.LogWarning("Google OAuth callback missing authorization code");
                return Redirect($"{frontendUrl}/auth/login?error=google_failed&message={Uri.EscapeDataString("No authorization code received")}");
            }
            
            if (_googleOAuthService != null)
            {
                var callbackUri = $"{Request.Scheme}://{Request.Host}/api/v1/auth/google/callback";
                
                _logger.LogInformation("Processing Google OAuth callback with code");
                
                // Authenticate with Google - checks if user exists and returns appropriate response
                var result = await _googleOAuthService.AuthenticateAsync(code, callbackUri);
                
                if (result.UserExists && result.LoginResponse != null)
                {
                    // Existing user - redirect to oauth-success with tokens
                    _logger.LogInformation("Google OAuth login successful for existing user: {Email}", result.LoginResponse.User.Email);
                    var redirectUri = $"{frontendUrl}/auth/oauth-success";
                    return Redirect($"{redirectUri}?accessToken={Uri.EscapeDataString(result.LoginResponse.AccessToken)}&refreshToken={Uri.EscapeDataString(result.LoginResponse.RefreshToken)}");
                }
                else if (!result.UserExists && result.Profile != null)
                {
                    // New user - redirect to registration with email pre-filled
                    _logger.LogInformation("New Google user - redirecting to registration: {Email}", result.Profile.Email);
                    var redirectUri = $"{frontendUrl}/auth/register";
                    return Redirect($"{redirectUri}?source=google&email={Uri.EscapeDataString(result.Profile.Email)}&providerId={Uri.EscapeDataString(result.Profile.Sub)}");
                }
                else
                {
                    // This shouldn't happen
                    _logger.LogError("Invalid authentication result from Google OAuth");
                    return Redirect($"{frontendUrl}/auth/login?error=google_failed&message={Uri.EscapeDataString("Authentication failed")}");
                }
            }
            
            // Fallback for development
            _logger.LogWarning("Google OAuth service not available - using fallback");
            var devRedirectUri = $"{frontendUrl}/auth/register";
            return Redirect($"{devRedirectUri}?source=google&email=user@example.com");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Google callback validation error: {Message}", ex.Message);
            return Redirect($"{frontendUrl}/auth/login?error=google_failed&message={Uri.EscapeDataString(ex.Message)}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google callback unexpected error: {Message}", ex.Message);
            return Redirect($"{frontendUrl}/auth/login?error=google_failed&message={Uri.EscapeDataString("An unexpected error occurred during Google login")}");
        }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            await _authService.RequestPasswordResetAsync(request.Email);
            // Always return success to prevent email enumeration
            return Ok(new { message = "If an account with that email exists, a password reset link has been sent." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = "invalid_request", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Forgot password failed");
            return StatusCode(500, new { error = "internal_error", message = "Failed to process password reset request" });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            await _authService.ResetPasswordAsync(request.Token, request.NewPassword);
            return Ok(new { message = "Password has been reset successfully" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "invalid_request", message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { error = "invalid_token", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Reset password failed");
            return StatusCode(500, new { error = "internal_error", message = "Failed to reset password" });
        }
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        try
        {
            await _authService.VerifyEmailAsync(request.Token);
            return Ok(new { message = "Email verified successfully" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "invalid_request", message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { error = "invalid_token", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email verification failed");
            return StatusCode(500, new { error = "internal_error", message = "Failed to verify email" });
        }
    }
}

public record RefreshTokenRequest(string RefreshToken);
