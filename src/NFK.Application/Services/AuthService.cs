using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
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
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthService(
        ApplicationDbContext context,
        JwtService jwtService,
        PasswordHasher passwordHasher,
        ILogger<AuthService> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request)
    {
        var ipAddress = GetClientIpAddress();
        _logger.LogInformation("Registration attempt for email: {Email} from IP: {IP}", request.Email, ipAddress);

        // Validate email format
        if (!IsValidEmail(request.Email))
        {
            _logger.LogWarning("Registration failed - invalid email format: {Email} from IP: {IP}", request.Email, ipAddress);
            throw new ArgumentException("Invalid email format.");
        }

        // Validate password using enhanced policy
        var passwordValidation = PasswordPolicy.Validate(request.Password);
        if (!passwordValidation.IsValid)
        {
            _logger.LogWarning("Registration failed - password policy violation for: {Email} from IP: {IP}", request.Email, ipAddress);
            throw new ArgumentException(string.Join(" ", passwordValidation.Errors));
        }

        // Check if user already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (existingUser != null)
        {
            _logger.LogWarning("Registration failed - user exists: {Email} from IP: {IP}", request.Email, ipAddress);
            throw new InvalidOperationException("User with this email already exists.");
        }

        // Hash password
        var passwordHash = _passwordHasher.HashPassword(request.Password);

        // Calculate password expiration (90 days from now for employees)
        var passwordExpiresAt = DateTime.UtcNow.AddDays(PasswordPolicy.PasswordExpirationDays);

        // Create user
        var user = new User
        {
            Email = request.Email,
            PasswordHash = passwordHash,
            FirstName = SanitizeInput(request.FirstName),
            LastName = SanitizeInput(request.LastName),
            PhoneNumber = request.PhoneNumber,
            FullLegalName = request.FullLegalName,
            DateOfBirth = request.DateOfBirth,
            Address = request.Address,
            City = request.City,
            PostalCode = request.PostalCode,
            Country = request.Country ?? "Germany",
            TaxId = request.TaxId,
            PhoneVerified = false,
            // Firm details (optional)
            FirmLegalName = request.FirmLegalName,
            FirmTaxId = request.FirmTaxId,
            FirmChamberRegistration = request.FirmChamberRegistration,
            FirmAddress = request.FirmAddress,
            FirmCity = request.FirmCity,
            FirmPostalCode = request.FirmPostalCode,
            FirmCountry = request.FirmCountry,
            // OAuth IDs
            GoogleId = request.GoogleId,
            DATEVId = request.DATEVId,
            IsActive = true,
            IsEmailConfirmed = string.IsNullOrEmpty(request.GoogleId) ? false : true, // Auto-confirm for OAuth
            FailedLoginAttempts = 0,
            // Security fields
            PasswordChangedAt = DateTime.UtcNow,
            PasswordExpiresAt = passwordExpiresAt,
            MfaEnabled = false
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        
        // Add to password history
        var passwordHistory = new PasswordHistory
        {
            UserId = user.Id,
            PasswordHash = passwordHash,
            CreatedAtUtc = DateTime.UtcNow
        };
        _context.PasswordHistories.Add(passwordHistory);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User registered successfully: {UserId}, Email: {Email} from IP: {IP}", user.Id, user.Email, ipAddress);

        return new RegisterResponse("Registration successful", user.Id);
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var ipAddress = GetClientIpAddress();
        var userAgent = GetUserAgent();
        _logger.LogInformation("Login attempt for email: {Email} from IP: {IP}", request.Email, ipAddress);

        // Find user by email
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
        {
            _logger.LogWarning("Login failed - user not found: {Email} from IP: {IP}", request.Email, ipAddress);
            // Log failed attempt for security monitoring
            await LogFailedLoginAttempt(request.Email, ipAddress, "User not found");
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        // Check if account is locked
        if (user.IsLocked && user.LockedUntil.HasValue && user.LockedUntil.Value > DateTime.UtcNow)
        {
            _logger.LogWarning("Login failed - account locked: {Email} from IP: {IP}, Locked until: {LockedUntil}", 
                request.Email, ipAddress, user.LockedUntil.Value);
            await LogFailedLoginAttempt(request.Email, ipAddress, "Account locked");
            throw new UnauthorizedAccessException("Account is locked. Please try again later.");
        }

        // Check if account is active
        if (!user.IsActive)
        {
            _logger.LogWarning("Login failed - account inactive: {Email} from IP: {IP}", request.Email, ipAddress);
            await LogFailedLoginAttempt(request.Email, ipAddress, "Account inactive");
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
                _logger.LogWarning("Account locked due to multiple failed attempts: {Email} from IP: {IP}", request.Email, ipAddress);
            }
            await _context.SaveChangesAsync();
            await LogFailedLoginAttempt(request.Email, ipAddress, "Invalid password");

            _logger.LogWarning("Login failed - invalid password: {Email} from IP: {IP}, Failed attempts: {Attempts}", 
                request.Email, ipAddress, user.FailedLoginAttempts);
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

        // Store refresh token with IP and user agent for security tracking
        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtService.GetRefreshTokenExpirationDays()),
            IsRevoked = false,
            IpAddress = ipAddress,
            UserAgent = userAgent
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User logged in successfully: {UserId}, Email: {Email} from IP: {IP}", user.Id, user.Email, ipAddress);

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
        var ipAddress = GetClientIpAddress();
        _logger.LogInformation("Refresh token attempt from IP: {IP}", ipAddress);

        // Find refresh token
        var tokenEntity = await _context.RefreshTokens
            .Include(rt => rt.User)
                .ThenInclude(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (tokenEntity == null)
        {
            _logger.LogWarning("Refresh failed - token not found from IP: {IP}", ipAddress);
            throw new UnauthorizedAccessException("Invalid refresh token");
        }

        // Check if token is expired
        if (tokenEntity.ExpiresAt < DateTime.UtcNow)
        {
            _logger.LogWarning("Refresh failed - token expired for user: {UserId} from IP: {IP}", tokenEntity.UserId, ipAddress);
            throw new UnauthorizedAccessException("Refresh token has expired");
        }

        // Check if token is revoked
        if (tokenEntity.IsRevoked)
        {
            _logger.LogWarning("Refresh failed - token revoked for user: {UserId} from IP: {IP}", tokenEntity.UserId, ipAddress);
            throw new UnauthorizedAccessException("Refresh token has been revoked");
        }

        var user = tokenEntity.User;

        // Check if user is active
        if (!user.IsActive)
        {
            _logger.LogWarning("Refresh failed - user inactive: {UserId} from IP: {IP}", user.Id, ipAddress);
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

        // Rotate refresh token for enhanced security
        var newRefreshToken = _jwtService.GenerateRefreshToken();
        
        // Revoke old token
        tokenEntity.IsRevoked = true;
        tokenEntity.RevokedAt = DateTime.UtcNow;
        
        // Create new refresh token
        var newTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            Token = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtService.GetRefreshTokenExpirationDays()),
            IsRevoked = false,
            IpAddress = ipAddress,
            UserAgent = GetUserAgent()
        };

        _context.RefreshTokens.Add(newTokenEntity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Token refreshed successfully for user: {UserId} from IP: {IP}", user.Id, ipAddress);

        return new RefreshResponse(
            accessToken,
            newRefreshToken,
            _jwtService.GetAccessTokenExpirationSeconds(),
            "Bearer"
        );
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var ipAddress = GetClientIpAddress();
        _logger.LogInformation("Logout attempt from IP: {IP}", ipAddress);

        // Find and revoke refresh token
        var tokenEntity = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (tokenEntity != null)
        {
            tokenEntity.IsRevoked = true;
            tokenEntity.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            _logger.LogInformation("User logged out successfully: {UserId} from IP: {IP}", tokenEntity.UserId, ipAddress);
        }
    }

    public async Task<UserResponse> GetUserByIdAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        var role = user.UserRoles.FirstOrDefault()?.Role.Name ?? "Client";

        return new UserResponse(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.PhoneNumber,
            role,
            user.IsActive,
            user.FullLegalName,
            user.DateOfBirth,
            user.Address,
            user.City,
            user.PostalCode,
            user.Country,
            user.TaxId,
            user.FirmLegalName,
            user.FirmTaxId,
            user.FirmChamberRegistration
        );
    }

    public async Task<string> RequestPasswordResetAsync(string email)
    {
        var ipAddress = GetClientIpAddress();
        _logger.LogInformation("Password reset request for email: {Email} from IP: {IP}", email, ipAddress);

        // Find user by email
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            _logger.LogWarning("Password reset request failed - user not found: {Email} from IP: {IP}", email, ipAddress);
            // Return success even if user not found to prevent email enumeration
            // But don't create a token
            return string.Empty;
        }

        // Check if user is active
        if (!user.IsActive)
        {
            _logger.LogWarning("Password reset request failed - account inactive: {Email} from IP: {IP}", email, ipAddress);
            throw new InvalidOperationException("Account is not active.");
        }

        // Generate secure random token
        var token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));

        // Create password reset token
        var resetToken = new PasswordResetToken
        {
            UserId = user.Id,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(1), // Token expires in 1 hour
            IsUsed = false
        };

        _context.PasswordResetTokens.Add(resetToken);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Password reset token created for user: {UserId}, Email: {Email} from IP: {IP}", user.Id, user.Email, ipAddress);

        // TODO: Send email with reset link
        // For now, log the token at debug level (placeholder for email functionality)
        _logger.LogDebug("Password reset token for {Email}: {Token}", email, token);
        _logger.LogDebug("Reset link: /reset-password?token={Token}", token);

        return token;
    }

    public async Task ResetPasswordAsync(string token, string newPassword)
    {
        var ipAddress = GetClientIpAddress();
        _logger.LogInformation("Password reset attempt from IP: {IP}", ipAddress);

        // Validate password requirements
        if (!ValidatePassword(newPassword))
        {
            _logger.LogWarning("Password reset failed - weak password from IP: {IP}", ipAddress);
            throw new ArgumentException("Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.");
        }

        // Find reset token
        var resetToken = await _context.PasswordResetTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == token);

        if (resetToken == null)
        {
            _logger.LogWarning("Password reset failed - invalid token from IP: {IP}", ipAddress);
            throw new UnauthorizedAccessException("Invalid or expired reset token.");
        }

        // Check if token has expired
        if (resetToken.ExpiresAt < DateTime.UtcNow)
        {
            _logger.LogWarning("Password reset failed - token expired for user: {UserId} from IP: {IP}", resetToken.UserId, ipAddress);
            throw new UnauthorizedAccessException("Invalid or expired reset token.");
        }

        // Check if token has already been used
        if (resetToken.IsUsed)
        {
            _logger.LogWarning("Password reset failed - token already used for user: {UserId} from IP: {IP}", resetToken.UserId, ipAddress);
            throw new UnauthorizedAccessException("Invalid or expired reset token.");
        }

        // Update password
        var user = resetToken.User;
        user.PasswordHash = _passwordHasher.HashPassword(newPassword);

        // Mark token as used
        resetToken.IsUsed = true;

        // Reset failed login attempts and unlock account if locked
        user.FailedLoginAttempts = 0;
        user.IsLocked = false;
        user.LockedUntil = null;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Password reset successful for user: {UserId}, Email: {Email} from IP: {IP}", user.Id, user.Email, ipAddress);
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

    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    private string SanitizeInput(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // Remove potentially dangerous characters that could be used in injection attacks
        // Allow only letters, spaces, hyphens, and apostrophes for names
        var allowedChars = input.Where(c => 
            char.IsLetter(c) || 
            char.IsWhiteSpace(c) || 
            c == '-' || 
            c == '\'' ||
            c == '.'
        ).ToArray();
        
        return new string(allowedChars).Trim();
    }

    private string GetClientIpAddress()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
            return "Unknown";

        // Check for forwarded IP first (in case of proxy/load balancer)
        var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        return httpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
    }

    private string GetUserAgent()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
            return "Unknown";

        return httpContext.Request.Headers["User-Agent"].FirstOrDefault() ?? "Unknown";
    }

    private async Task LogFailedLoginAttempt(string email, string ipAddress, string reason)
    {
        // Log to audit trail for security monitoring
        try
        {
            var loginAttempt = new Domain.Entities.Audit.LoginAttempt
            {
                Email = email,
                IpAddress = ipAddress,
                UserAgent = GetUserAgent(),
                IsSuccessful = false,
                FailureReason = reason
            };

            _context.Set<Domain.Entities.Audit.LoginAttempt>().Add(loginAttempt);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log login attempt for email: {Email}", email);
        }
    }
}
