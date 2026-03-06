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
/// Tests for the ResendVerificationEmailAsync flow:
/// - Non-existent email → generic success (no exception, no email sent)
/// - Already-verified account → generic success (no exception, no email sent)
/// - Unverified account → existing tokens invalidated, fresh token created, email attempted
/// - Per-email cooldown → second call within 60 s is silently ignored
/// - Per-IP rate limit exceeded → call is silently ignored, no email sent
/// </summary>
public class ResendVerificationTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly AuthService _authService;
    private readonly Mock<IEmailService> _emailMock;
    private readonly Mock<IDistributedCache> _cacheMock;

    public ResendVerificationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _db = new ApplicationDbContext(options);

        var jwtService = new JwtService("issuer", "audience", "test-secret-key-that-is-long-enough-32chars");
        var passwordHasher = new PasswordHasher();
        var logger = NullLogger<AuthService>.Instance;
        var httpContext = new Mock<IHttpContextAccessor>();

        _emailMock = new Mock<IEmailService>();
        _cacheMock = new Mock<IDistributedCache>();

        // Default: no cached entries (cooldowns inactive)
        _cacheMock
            .Setup(c => c.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((byte[]?)null);

        _authService = new AuthService(
            _db, jwtService, passwordHasher, logger, httpContext.Object,
            _emailMock.Object, _cacheMock.Object);
    }

    public void Dispose() => _db.Dispose();

    private async Task<User> SeedUnverifiedUserAsync(string email = "unverified@example.com")
    {
        var user = new User
        {
            Email = email,
            FirstName = "Test",
            LastName = "User",
            IsActive = true,
            IsEmailConfirmed = false,
            PasswordHash = new PasswordHasher().HashPassword("SomePassword1!")
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    private async Task<User> SeedVerifiedUserAsync(string email = "verified@example.com")
    {
        var user = new User
        {
            Email = email,
            FirstName = "Test",
            LastName = "User",
            IsActive = true,
            IsEmailConfirmed = true,
            PasswordHash = new PasswordHasher().HashPassword("SomePassword1!")
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    private async Task SeedVerificationTokenAsync(int userId, string token)
    {
        _db.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            UserId = userId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsUsed = false
        });
        await _db.SaveChangesAsync();
    }

    // 1. Non-existent email → completes without throwing, no email is sent.
    [Fact]
    public async Task NonExistentEmail_ReturnsGenericSuccess_NoEmailSent()
    {
        await _authService.ResendVerificationEmailAsync("nobody@example.com");

        _emailMock.Verify(
            e => e.SendEmailVerificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    // 2. Already-verified account → completes without throwing, no email is sent.
    [Fact]
    public async Task AlreadyVerifiedAccount_ReturnsGenericSuccess_NoEmailSent()
    {
        await SeedVerifiedUserAsync();

        await _authService.ResendVerificationEmailAsync("verified@example.com");

        _emailMock.Verify(
            e => e.SendEmailVerificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    // 3. Unverified account → old token invalidated, new token created, email sent.
    [Fact]
    public async Task UnverifiedAccount_OldTokensInvalidated_NewTokenCreated_EmailSent()
    {
        var user = await SeedUnverifiedUserAsync();
        await SeedVerificationTokenAsync(user.Id, "old-token-abc");

        await _authService.ResendVerificationEmailAsync("unverified@example.com");

        // Old unused token should be removed
        var remainingTokens = await _db.EmailVerificationTokens
            .Where(t => t.UserId == user.Id && !t.IsUsed)
            .ToListAsync();
        Assert.Single(remainingTokens);
        Assert.NotEqual("old-token-abc", remainingTokens[0].Token);

        // New token is URL-safe Base64Url
        var newToken = remainingTokens[0].Token;
        Assert.DoesNotContain('+', newToken);
        Assert.DoesNotContain('/', newToken);
        Assert.DoesNotContain('=', newToken);
        Assert.DoesNotContain(' ', newToken);

        // Email was sent exactly once
        _emailMock.Verify(
            e => e.SendEmailVerificationAsync("unverified@example.com", "Test", It.IsAny<string>()),
            Times.Once);
    }

    // 4. Per-email cooldown active → second call is silently ignored, no email sent again.
    [Fact]
    public async Task EmailCooldownActive_SecondCallIgnored_NoEmailSent()
    {
        await SeedUnverifiedUserAsync();

        // Simulate an active cooldown by returning a non-null byte array for the email cache key
        _cacheMock
            .Setup(c => c.GetAsync(
                It.Is<string>(k => k.StartsWith("resendverif:email:")),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new byte[] { 1 });

        await _authService.ResendVerificationEmailAsync("unverified@example.com");

        _emailMock.Verify(
            e => e.SendEmailVerificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    // 5. Per-IP rate limit exceeded → call is silently ignored, no email sent.
    [Fact]
    public async Task IpRateLimitExceeded_CallIgnored_NoEmailSent()
    {
        await SeedUnverifiedUserAsync();

        // Email key has no cooldown, but IP counter is at max (5)
        _cacheMock
            .Setup(c => c.GetAsync(
                It.Is<string>(k => k.StartsWith("resendverif:email:")),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((byte[]?)null);
        _cacheMock
            .Setup(c => c.GetAsync(
                It.Is<string>(k => k.StartsWith("resendverif:ip:")),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(System.Text.Encoding.UTF8.GetBytes("5"));

        await _authService.ResendVerificationEmailAsync("unverified@example.com");

        _emailMock.Verify(
            e => e.SendEmailVerificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }
}
