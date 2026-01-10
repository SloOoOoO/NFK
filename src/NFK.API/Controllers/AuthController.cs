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

    public AuthController(ILogger<AuthController> logger, IAuthService authService)
    {
        _logger = logger;
        _authService = authService;
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
}

public record RefreshTokenRequest(string RefreshToken);
