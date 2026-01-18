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

    public AuthController(ILogger<AuthController> logger, IAuthService authService, IConfiguration configuration)
    {
        _logger = logger;
        _authService = authService;
        _configuration = configuration;
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
        // In production, this would use actual DATEV OAuth configuration
        // For now, simulate the OAuth flow by redirecting to a placeholder
        var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
        var redirectUri = $"{frontendUrl}/auth/register";
        var simulatedFirstName = "Max";
        var simulatedLastName = "Mustermann";
        
        // Redirect to registration with DATEV data pre-filled
        return Redirect($"{redirectUri}?source=datev&firstName={simulatedFirstName}&lastName={simulatedLastName}");
    }

    /// <summary>
    /// DATEV OAuth Callback - Handles the OAuth callback from DATEV
    /// </summary>
    [HttpGet("datev/callback")]
    public IActionResult DATEVCallback([FromQuery] string code)
    {
        try
        {
            // In production, exchange code for token and get user info from DATEV
            // For now, redirect to registration
            var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
            var redirectUri = $"{frontendUrl}/auth/register";
            return Redirect($"{redirectUri}?source=datev&firstName=Max&lastName=Mustermann");
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
        // In production, this would use actual Google OAuth configuration
        // For now, simulate the OAuth flow
        var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
        var redirectUri = $"{frontendUrl}/auth/register";
        var simulatedEmail = "user@example.com";
        
        // Redirect to registration with Google email pre-filled
        return Redirect($"{redirectUri}?source=google&email={simulatedEmail}");
    }

    /// <summary>
    /// Google OAuth Callback - Handles the OAuth callback from Google
    /// </summary>
    [HttpGet("google/callback")]
    public IActionResult GoogleCallback([FromQuery] string code)
    {
        try
        {
            // In production, exchange code for token and get user info from Google
            // For now, redirect to registration
            var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
            var redirectUri = $"{frontendUrl}/auth/register";
            return Redirect($"{redirectUri}?source=google&email=user@example.com");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google callback error");
            var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
            return Redirect($"{frontendUrl}/auth/login?error=google_failed");
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
}

public record RefreshTokenRequest(string RefreshToken);
