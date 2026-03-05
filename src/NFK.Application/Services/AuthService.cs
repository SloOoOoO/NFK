using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
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
    private readonly IEmailService _emailService;
    private readonly IDistributedCache _cache;

    public AuthService(
        ApplicationDbContext context,
        JwtService jwtService,
        PasswordHasher passwordHasher,
        ILogger<AuthService> logger,
        IHttpContextAccessor httpContextAccessor,
        IEmailService emailService,
        IDistributedCache cache)
    {
        _context = context;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
        _emailService = emailService;
        _cache = cache;
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

        // Use transaction to ensure atomicity
        using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
        try
        {
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
                Address = request.Address ?? request.Street, // Use Street if Address not provided
                City = request.City,
                PostalCode = request.PostalCode,
                Country = request.Country ?? "Germany",
                TaxId = request.TaxId,
                TaxNumber = request.TaxNumber,
                VatId = request.VatId,
                CommercialRegister = request.CommercialRegister,
                PhoneVerified = false,
                // Client type and company fields
                ClientType = request.ClientType,
                CompanyName = request.CompanyName,
                Salutation = request.Salutation,
                Gender = request.Gender,
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
                PasswordExpiresAt = passwordExpiresAt
            };

            _context.Users.Add(user);
            
            // Save user first to get the generated Id
            await _context.SaveChangesAsync();
            
            // Now create password history and audit log with the persisted user.Id
            var passwordHistory = new PasswordHistory
            {
                UserId = user.Id,
                PasswordHash = passwordHash,
                CreatedAtUtc = DateTime.UtcNow
            };
            _context.PasswordHistories.Add(passwordHistory);

            // Assign RegisteredUser role automatically (not Client role)
            // Users become Client role only when Admin/SuperAdmin/Consultant adds them via Clients navigation
            var registeredUserRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "RegisteredUser");
            if (registeredUserRole != null)
            {
                var userRole = new UserRole
                {
                    UserId = user.Id,
                    RoleId = registeredUserRole.Id
                };
                _context.UserRoles.Add(userRole);
            }
            else
            {
                _logger.LogWarning("RegisteredUser role not found in database during registration for user: {Email}", user.Email);
            }

            // Do NOT create Client record during registration
            // Client records are created only when Admin/SuperAdmin/Consultant adds user via Clients navigation

            // Log user registration to audit trail
            var auditLog = new Domain.Entities.Audit.AuditLog
            {
                UserId = user.Id,
                Action = "UserRegistration",
                EntityType = "User",
                EntityId = user.Id,
                IpAddress = ipAddress,
                Details = $"New user registered: {user.Email}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Set<Domain.Entities.Audit.AuditLog>().Add(auditLog);
            
            // Save password history, role, client record, and audit log together
            await _context.SaveChangesAsync();

            // Generate email verification token for non-OAuth users
            if (string.IsNullOrEmpty(request.GoogleId) && string.IsNullOrEmpty(request.DATEVId))
            {
                var verificationToken = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32))
                    .Replace('+', '-').Replace('/', '_').TrimEnd('=');
                var emailVerificationToken = new EmailVerificationToken
                {
                    UserId = user.Id,
                    Token = verificationToken,
                    ExpiresAt = DateTime.UtcNow.AddHours(24),
                    IsUsed = false
                };
                _context.EmailVerificationTokens.Add(emailVerificationToken);
                await _context.SaveChangesAsync();

                // Send verification email
                try
                {
                    await _emailService.SendEmailVerificationAsync(user.Email, user.FirstName, verificationToken);
                    _logger.LogInformation("Verification email sent to: {Email}", user.Email);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send verification email to: {Email}", user.Email);
                    // Continue with registration even if email fails
                }
            }

            // Commit transaction
            await transaction.CommitAsync();

            _logger.LogInformation("User registered successfully: {UserId}, Email: {Email} from IP: {IP}", user.Id, user.Email, ipAddress);

            return new RegisterResponse("Registration successful. Please check your email to verify your account.", user.Id);
        }
        catch (Exception ex)
        {
            // Transaction will auto-rollback on disposal if not committed
            _logger.LogError(ex, "Registration failed for email: {Email} from IP: {IP}", request.Email, ipAddress);
            throw;
        }
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

        // Check if email has been verified
        if (!user.IsEmailConfirmed)
        {
            _logger.LogWarning("Login failed - email not verified: {Email} from IP: {IP}", request.Email, ipAddress);
            await LogFailedLoginAttempt(request.Email, ipAddress, "Email not verified");
            throw new UnauthorizedAccessException("Please verify your email address before logging in. Check your inbox for the verification email.");
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

        // Record successful login in LoginAttempts for statistics tracking
        var successfulLogin = new Domain.Entities.Audit.LoginAttempt
        {
            Email = user.Email,
            IsSuccessful = true,
            IpAddress = ipAddress,
            UserAgent = userAgent
        };
        _context.LoginAttempts.Add(successfulLogin);

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
        tokenEntity.ReplacedByToken = newRefreshToken;
        tokenEntity.ReasonRevoked = "Replaced by refresh";
        
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
            tokenEntity.ReasonRevoked = "User logout";
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
            user.TaxNumber,
            user.VatId,
            user.CommercialRegister,
            user.ClientType,
            user.CompanyName,
            user.Salutation,
            user.Gender,
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
            // Send notification that email is not in database
            try
            {
                await _emailService.SendEmailNotFoundNotificationAsync(email);
                _logger.LogInformation("Email not found notification sent to: {Email}", email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email not found notification to: {Email}", email);
            }
            // Return empty string to prevent email enumeration (frontend gets success message anyway)
            return string.Empty;
        }

        // Check if user is active
        if (!user.IsActive)
        {
            _logger.LogWarning("Password reset request failed - account inactive: {Email} from IP: {IP}", email, ipAddress);
            throw new InvalidOperationException("Account is not active.");
        }

        // Generate secure random token using Base64Url (RFC 4648 URL-safe alphabet):
        // replaces '+' with '-' and '/' with '_', and strips '=' padding so the token
        // contains only unreserved URL characters and never needs percent-encoding.
        var token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

        _logger.LogDebug("Password reset token created: format=url-safe, length={Length}", token.Length);

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

        // Send password reset email
        try
        {
            await _emailService.SendPasswordResetEmailAsync(user.Email, user.FirstName, token);
            _logger.LogInformation("Password reset email sent to: {Email}", user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to: {Email}", user.Email);
            // Continue even if email fails - token is still valid
        }

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

        // Classify and normalise the incoming token to handle transport corruption.
        // URL-safe Base64Url tokens (current format) use only A-Za-z0-9, '-', '_'.
        // Legacy standard-Base64 tokens contain '+', '/' and/or '=' padding.
        // Browser URLSearchParams.get() follows application/x-www-form-urlencoded
        // semantics and silently decodes '+' as a space.  Other characters ('/', '=')
        // are NOT decoded by URLSearchParams, so only space→'+' normalisation is needed.
        string lookupToken = token.Contains(' ')
            ? token.Replace(' ', '+')   // space→'+' backward-compat for legacy tokens
            : token;
        bool isUrlSafeFormat = !lookupToken.Contains('+') && !lookupToken.Contains('/') && !lookupToken.Contains('=');

        _logger.LogDebug("Password reset token format: {Format}, length={Length}",
            isUrlSafeFormat ? "url-safe" : "legacy", token.Length);

        // Find reset token
        var resetToken = await _context.PasswordResetTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == lookupToken);

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
    
    public async Task VerifyEmailAsync(string token)
    {
        var ipAddress = GetClientIpAddress();
        _logger.LogInformation("Email verification attempt from IP: {IP}", ipAddress);

        // Find verification token
        var verificationToken = await _context.EmailVerificationTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed);

        if (verificationToken == null)
        {
            _logger.LogWarning("Email verification failed - invalid token from IP: {IP}", ipAddress);
            throw new UnauthorizedAccessException("Invalid or expired verification token.");
        }

        // Check if token is expired
        if (verificationToken.ExpiresAt < DateTime.UtcNow)
        {
            _logger.LogWarning("Email verification failed - token expired from IP: {IP}", ipAddress);
            throw new UnauthorizedAccessException("Verification token has expired. Please request a new one.");
        }

        // Mark user as verified
        var user = verificationToken.User;
        if (user == null)
        {
            _logger.LogError("Email verification failed - user not found for token from IP: {IP}", ipAddress);
            throw new InvalidOperationException("User not found.");
        }

        user.IsEmailConfirmed = true;
        user.IsActive = true;
        
        // Mark token as used
        verificationToken.IsUsed = true;
        verificationToken.UsedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();

        // Send welcome email
        try
        {
            await _emailService.SendWelcomeEmailAsync(user.Email, user.FirstName);
            _logger.LogInformation("Welcome email sent to: {Email}", user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send welcome email to: {Email}", user.Email);
            // Continue even if email fails
        }

        _logger.LogInformation("Email verified successfully for user: {UserId}, Email: {Email} from IP: {IP}", user.Id, user.Email, ipAddress);
    }

    /// <summary>
    /// Resend verification email for a given email address.
    /// Always returns without revealing whether the account exists or is already verified,
    /// to prevent account enumeration. Per-email (60 s) and per-IP (5 / 10 min) cooldowns
    /// are enforced via the distributed cache.
    /// </summary>
    public async Task ResendVerificationEmailAsync(string email)
    {
        var ipAddress = GetClientIpAddress();

        // Per-email cooldown: one resend every 60 seconds
        var emailCacheKey = $"resendverif:email:{email.ToLowerInvariant()}";
        var emailCooldown = await _cache.GetStringAsync(emailCacheKey);
        if (emailCooldown != null)
        {
            _logger.LogInformation("Resend verification email cooldown active from IP: {IP}", ipAddress);
            return; // Generic return – no enumeration leak
        }

        // Per-IP rate limit: 5 resend attempts per 10-minute window
        var ipCacheKey = $"resendverif:ip:{ipAddress}";
        var ipCountStr = await _cache.GetStringAsync(ipCacheKey);
        var ipCount = int.TryParse(ipCountStr, out var c) ? c : 0;
        if (ipCount >= 5)
        {
            _logger.LogWarning("Resend verification IP rate limit exceeded for IP: {IP}", ipAddress);
            return; // Generic return – no enumeration leak
        }

        // Always set cooldowns before touching the DB so timing attacks reveal nothing
        var emailCooldownOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(60)
        };
        await _cache.SetStringAsync(emailCacheKey, "1", emailCooldownOptions);

        // Increment IP counter; keep the same absolute window on the first set
        var ipCountOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
        };
        await _cache.SetStringAsync(ipCacheKey, (ipCount + 1).ToString(), ipCountOptions);

        // Find user – silent return if not found or already verified
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            _logger.LogInformation("Resend verification: no account for provided email from IP: {IP}", ipAddress);
            return;
        }

        if (user.IsEmailConfirmed)
        {
            _logger.LogInformation("Resend verification: account already verified for user: {UserId} from IP: {IP}", user.Id, ipAddress);
            return;
        }

        // Invalidate all unused verification tokens for this user before issuing a fresh one
        var oldTokens = await _context.EmailVerificationTokens
            .Where(t => t.UserId == user.Id && !t.IsUsed)
            .ToListAsync();
        _context.EmailVerificationTokens.RemoveRange(oldTokens);

        // Generate a new URL-safe Base64Url token (same approach as registration & password reset)
        var verificationToken = Convert.ToBase64String(
                System.Security.Cryptography.RandomNumberGenerator.GetBytes(32))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

        var tokenEntity = new EmailVerificationToken
        {
            UserId = user.Id,
            Token = verificationToken,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsUsed = false
        };
        _context.EmailVerificationTokens.Add(tokenEntity);
        await _context.SaveChangesAsync();

        // Attempt to send the email; failures are logged but do not surface to the caller
        try
        {
            await _emailService.SendEmailVerificationAsync(user.Email, user.FirstName, verificationToken);
            _logger.LogInformation("Resend verification email sent for user: {UserId} from IP: {IP}", user.Id, ipAddress);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send resend verification email for user: {UserId} from IP: {IP}", user.Id, ipAddress);
        }
    }
}
