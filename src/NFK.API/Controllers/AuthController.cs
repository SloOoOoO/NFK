using Microsoft.AspNetCore.Mvc;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;

    public AuthController(ILogger<AuthController> logger)
    {
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // TODO: Implement registration
        _logger.LogInformation("Registration attempt for email: {Email}", request.Email);
        return Ok(new { message = "Registration endpoint - to be implemented" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // TODO: Implement login
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);
        return Ok(new { message = "Login endpoint - to be implemented" });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        // TODO: Implement token refresh
        return Ok(new { message = "Refresh endpoint - to be implemented" });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        // TODO: Implement logout
        return Ok(new { message = "Logout endpoint - to be implemented" });
    }
}

public record RegisterRequest(string Email, string Password, string FirstName, string LastName);
public record LoginRequest(string Email, string Password);
public record RefreshTokenRequest(string RefreshToken);
