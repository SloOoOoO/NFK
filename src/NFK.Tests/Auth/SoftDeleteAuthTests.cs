using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NFK.Application.Interfaces;
using NFK.Application.Services;
using NFK.Domain.Entities.Users;
using NFK.Infrastructure.Data;
using NFK.Infrastructure.Security;

namespace NFK.Tests.Auth;

/// <summary>
/// Tests verifying correct behaviour when a user's account has been soft-deleted
/// (IsDeleted = true).  The global EF Core query filter hides these rows from normal
/// queries, which used to cause a contradiction: the unique index on Email blocks
/// re-registration while login/resend queries silently return "not found".
///
/// After the fix every auth flow uses IgnoreQueryFilters() so it can see the
/// soft-deleted row and act accordingly:
///   - Register  → reactivates the account (updates all fields, sets IsDeleted = false)
///   - Login     → returns "account deactivated" instead of "user not found"
///   - Resend    → treats deactivated as non-existent (no email sent, no leak)
///   - ForgotPwd → treats deactivated as non-existent (no email sent, no leak)
/// </summary>
public class SoftDeleteAuthTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly AuthService _authService;
    private readonly Mock<IEmailService> _emailMock;

    public SoftDeleteAuthTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _db = new ApplicationDbContext(options);

        var jwtService = new JwtService("issuer", "audience", "test-secret-key-that-is-long-enough-32chars");
        var passwordHasher = new PasswordHasher();
        var logger = NullLogger<AuthService>.Instance;
        var httpContext = new Mock<IHttpContextAccessor>();

        _emailMock = new Mock<IEmailService>();
        var cacheMock = new Mock<IDistributedCache>();
        cacheMock
            .Setup(c => c.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((byte[]?)null);

        _authService = new AuthService(
            _db, jwtService, passwordHasher, logger, httpContext.Object,
            _emailMock.Object, cacheMock.Object, CreateTestEncryptionService());
    }

    public void Dispose() => _db.Dispose();

    private static EncryptionService CreateTestEncryptionService()
    {
        var configMock = new Mock<Microsoft.Extensions.Configuration.IConfiguration>();
        configMock.Setup(c => c["Encryption:MasterKey"]).Returns("TestEncryptionKey32CharactersLong!");
        configMock.Setup(c => c["Encryption:DerivationSalt"]).Returns((string?)null);
        return new EncryptionService(configMock.Object, NullLogger<EncryptionService>.Instance);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<User> SeedSoftDeletedUserAsync(string email = "deleted@example.com")
    {
        var user = new User
        {
            Email = email,
            FirstName = "Old",
            LastName = "User",
            IsActive = false,
            IsDeleted = true,
            IsEmailConfirmed = true,
            PasswordHash = new PasswordHasher().HashPassword("OldPassword1!")
        };
        // Add directly to the DbSet – SaveChangesAsync only overrides CreatedAt for Added
        // entries, so IsDeleted = true is preserved as-is.
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        // Detach so subsequent queries re-fetch from the in-memory store
        _db.Entry(user).State = EntityState.Detached;
        return user;
    }

    private static NFK.Application.DTOs.Auth.RegisterRequest BuildRegisterRequest(string email) =>
        new NFK.Application.DTOs.Auth.RegisterRequest(
            Email: email,
            Password: "NewPassword1!Abcd",
            FirstName: "New",
            LastName: "User");

    // ── Register: reactivates soft-deleted account ────────────────────────────

    /// <summary>
    /// Registering with the same email as a soft-deleted account must succeed and
    /// reactivate the account rather than throwing "already exists".
    /// </summary>
    [Fact]
    public async Task Register_SoftDeletedEmail_ReactivatesAccount()
    {
        await SeedSoftDeletedUserAsync("deleted@example.com");

        _emailMock
            .Setup(e => e.SendEmailVerificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        var result = await _authService.RegisterAsync(BuildRegisterRequest("deleted@example.com"));

        Assert.NotNull(result);

        // The existing row should be reactivated (not a new row)
        var users = await _db.Users
            .IgnoreQueryFilters()
            .Where(u => u.Email == "deleted@example.com")
            .ToListAsync();
        Assert.Single(users);

        var reactivated = users[0];
        Assert.False(reactivated.IsDeleted);
        Assert.True(reactivated.IsActive);
        Assert.Equal("New", reactivated.FirstName);
        Assert.False(reactivated.IsEmailConfirmed); // needs re-verification
    }

    /// <summary>
    /// A verification email must be sent after reactivation.
    /// </summary>
    [Fact]
    public async Task Register_SoftDeletedEmail_SendsVerificationEmail()
    {
        await SeedSoftDeletedUserAsync("deleted@example.com");

        _emailMock
            .Setup(e => e.SendEmailVerificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        await _authService.RegisterAsync(BuildRegisterRequest("deleted@example.com"));

        _emailMock.Verify(
            e => e.SendEmailVerificationAsync("deleted@example.com", "New", It.IsAny<string>()),
            Times.Once);
    }

    /// <summary>
    /// Old unused verification tokens must be cleared when a soft-deleted account is
    /// reactivated, so the user only ever has one valid token.
    /// </summary>
    [Fact]
    public async Task Register_SoftDeletedEmail_OldVerificationTokensInvalidated()
    {
        var seeded = await SeedSoftDeletedUserAsync("deleted@example.com");

        // Manually insert an old token for the old account
        _db.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            UserId = seeded.Id,
            Token = "old-stale-token",
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsUsed = false
        });
        await _db.SaveChangesAsync();

        _emailMock
            .Setup(e => e.SendEmailVerificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        await _authService.RegisterAsync(BuildRegisterRequest("deleted@example.com"));

        var tokens = await _db.EmailVerificationTokens
            .Where(t => t.UserId == seeded.Id && !t.IsUsed)
            .ToListAsync();

        Assert.Single(tokens);
        Assert.NotEqual("old-stale-token", tokens[0].Token);
    }

    /// <summary>
    /// Registering with an active (non-deleted) account must still throw "already exists".
    /// </summary>
    [Fact]
    public async Task Register_ActiveEmail_StillThrowsAlreadyExists()
    {
        _emailMock
            .Setup(e => e.SendEmailVerificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        await _authService.RegisterAsync(BuildRegisterRequest("active@example.com"));

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _authService.RegisterAsync(BuildRegisterRequest("active@example.com")));

        Assert.Contains("already exists", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    // ── Login: clear message for soft-deleted accounts ────────────────────────

    /// <summary>
    /// Logging in with a soft-deleted account must throw an UnauthorizedAccessException
    /// with a "deactivated" message rather than the generic "Invalid email or password"
    /// message that would mislead the user into thinking their credentials are wrong.
    /// </summary>
    [Fact]
    public async Task Login_SoftDeletedAccount_ThrowsDeactivatedMessage()
    {
        await SeedSoftDeletedUserAsync("deleted@example.com");

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.LoginAsync(
                new NFK.Application.DTOs.Auth.LoginRequest("deleted@example.com", "OldPassword1!")));

        Assert.Contains("deactivated", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    // ── ResendVerification: soft-deleted treated as non-existent ─────────────

    /// <summary>
    /// Resending a verification email for a soft-deleted account must complete silently
    /// without sending any email (no enumeration leak about deleted accounts).
    /// </summary>
    [Fact]
    public async Task ResendVerification_SoftDeletedAccount_NoEmailSent()
    {
        await SeedSoftDeletedUserAsync("deleted@example.com");

        await _authService.ResendVerificationEmailAsync("deleted@example.com");

        _emailMock.Verify(
            e => e.SendEmailVerificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    // ── ForgotPassword: soft-deleted treated as non-existent ─────────────────

    /// <summary>
    /// Requesting a password reset for a soft-deleted account must return an empty
    /// token (same as "not found") without sending a reset email.
    /// </summary>
    [Fact]
    public async Task ForgotPassword_SoftDeletedAccount_ReturnsEmptyToken_NoEmailSent()
    {
        _emailMock
            .Setup(e => e.SendEmailNotFoundNotificationAsync(It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        await SeedSoftDeletedUserAsync("deleted@example.com");

        var token = await _authService.RequestPasswordResetAsync("deleted@example.com");

        Assert.Equal(string.Empty, token);

        _emailMock.Verify(
            e => e.SendPasswordResetEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }
}
