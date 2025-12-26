using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NFK.Application.DTOs.Auth;
using NFK.Application.Interfaces;
using NFK.Domain.Entities.Users;
using NFK.Infrastructure.Data;
using NFK.Infrastructure.Security;

namespace NFK.Application.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly JwtService _jwtService;
    private readonly PasswordHasher _passwordHasher;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        ApplicationDbContext context,
        JwtService jwtService,
        PasswordHasher passwordHasher,
        ILogger<AuthService> logger)
    {
        _context = context;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request)
    {
        _logger.LogInformation("Registration attempt for email: {Email}", request.Email);

        // Validate password requirements
        if (!ValidatePassword(request.Password))
        {
            throw new ArgumentException("Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.");
        }

        // Check if user already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (existingUser != null)
        {
            throw new InvalidOperationException("User with this email already exists.");
        }

        // Hash password
        var passwordHash = _passwordHasher.HashPassword(request.Password);

        // Create user
        var user = new User
        {
            Email = request.Email,
            PasswordHash = passwordHash,
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsActive = true,
            IsEmailConfirmed = false,
            FailedLoginAttempts = 0
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User registered successfully: {UserId}", user.Id);

        return new RegisterResponse("Registration successful", user.Id);
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);

        // Find user by email
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
        {
            _logger.LogWarning("Login failed - user not found: {Email}", request.Email);
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        // Check if account is locked
        if (user.IsLocked && user.LockedUntil.HasValue && user.LockedUntil.Value > DateTime.UtcNow)
        {
            _logger.LogWarning("Login failed - account locked: {Email}", request.Email);
            throw new UnauthorizedAccessException("Account is locked. Please try again later.");
        }

        // Check if account is active
        if (!user.IsActive)
        {
            _logger.LogWarning("Login failed - account inactive: {Email}", request.Email);
            throw new UnauthorizedAccessException("Account is not active.");
        }

        // Verify password
        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            // Increment failed login attempts
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 5)
            {
                user.IsLocked = true;
                user.LockedUntil = DateTime.UtcNow.AddMinutes(30);
                _logger.LogWarning("Account locked due to multiple failed attempts: {Email}", request.Email);
            }
            await _context.SaveChangesAsync();

            _logger.LogWarning("Login failed - invalid password: {Email}", request.Email);
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        // Reset failed login attempts on successful login
        user.FailedLoginAttempts = 0;
        user.IsLocked = false;
        user.LockedUntil = null;
        user.LastLoginAt = DateTime.UtcNow;

        // Get user roles
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var primaryRole = roles.FirstOrDefault() ?? "Client";

        // Generate tokens
        var accessToken = _jwtService.GenerateAccessToken(
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

        _logger.LogInformation("User logged in successfully: {UserId}", user.Id);

        return new LoginResponse(
            accessToken,
            refreshToken,
            _jwtService.GetAccessTokenExpirationSeconds(),
            "Bearer",
            new UserInfo(
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                primaryRole)
        );
    }

    public async Task<RefreshResponse> RefreshTokenAsync(string refreshToken)
    {
        _logger.LogInformation("Refresh token attempt");

        // Find refresh token
        var tokenEntity = await _context.RefreshTokens
            .Include(rt => rt.User)
                .ThenInclude(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (tokenEntity == null)
        {
            _logger.LogWarning("Refresh failed - token not found");
            throw new UnauthorizedAccessException("Invalid refresh token");
        }

        // Check if token is expired
        if (tokenEntity.ExpiresAt < DateTime.UtcNow)
        {
            _logger.LogWarning("Refresh failed - token expired");
            throw new UnauthorizedAccessException("Refresh token has expired");
        }

        // Check if token is revoked
        if (tokenEntity.IsRevoked)
        {
            _logger.LogWarning("Refresh failed - token revoked");
            throw new UnauthorizedAccessException("Refresh token has been revoked");
        }

        var user = tokenEntity.User;

        // Check if user is active
        if (!user.IsActive)
        {
            _logger.LogWarning("Refresh failed - user inactive: {UserId}", user.Id);
            throw new UnauthorizedAccessException("User account is not active");
        }

        // Get user roles
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();

        // Generate new access token
        var accessToken = _jwtService.GenerateAccessToken(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            roles);

        // Optionally rotate refresh token
        var newRefreshToken = _jwtService.GenerateRefreshToken();
        
        // Revoke old token
        tokenEntity.IsRevoked = true;
        
        // Create new refresh token
        var newTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            Token = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtService.GetRefreshTokenExpirationDays()),
            IsRevoked = false
        };

        _context.RefreshTokens.Add(newTokenEntity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Token refreshed successfully for user: {UserId}", user.Id);

        return new RefreshResponse(
            accessToken,
            newRefreshToken,
            _jwtService.GetAccessTokenExpirationSeconds(),
            "Bearer"
        );
    }

    public async Task LogoutAsync(string refreshToken)
    {
        _logger.LogInformation("Logout attempt");

        // Find and revoke refresh token
        var tokenEntity = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (tokenEntity != null)
        {
            tokenEntity.IsRevoked = true;
            await _context.SaveChangesAsync();
            _logger.LogInformation("User logged out successfully");
        }
    }

    private bool ValidatePassword(string password)
    {
        if (password.Length < 8)
            return false;

        bool hasUpper = false;
        bool hasLower = false;
        bool hasDigit = false;

        foreach (char c in password)
        {
            if (char.IsUpper(c)) hasUpper = true;
            if (char.IsLower(c)) hasLower = true;
            if (char.IsDigit(c)) hasDigit = true;
        }

        return hasUpper && hasLower && hasDigit;
    }
}
