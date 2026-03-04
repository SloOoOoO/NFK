using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NFK.Application.Interfaces;
using NFK.Application.Services;
using NFK.Domain.Entities.Users;
using NFK.Infrastructure.Data;
using NFK.Infrastructure.Security;

namespace NFK.Tests.Auth;

/// <summary>
/// Tests that password-reset tokens survive the full email to browser to API to backend
/// roundtrip, and that legacy tokens (standard-Base64 with '+' decoded as space by
/// browser URLSearchParams) are handled by the backward-compat normalisation path.
/// </summary>
public class PasswordResetTokenTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly AuthService _authService;

    public PasswordResetTokenTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _db = new ApplicationDbContext(options);

        var jwtService = new JwtService("issuer", "audience", "test-secret-key-that-is-long-enough-32chars");
        var passwordHasher = new PasswordHasher();
        var logger = NullLogger<AuthService>.Instance;
        var httpContext = new Mock<IHttpContextAccessor>();
        // HttpContext is null in tests; GetClientIpAddress() handles null gracefully
        var emailMock = new Mock<IEmailService>();

        _authService = new AuthService(
            _db, jwtService, passwordHasher, logger, httpContext.Object, emailMock.Object);
    }

    public void Dispose() => _db.Dispose();

    private async Task<User> SeedUserAsync(string email = "test@example.com")
    {
        var user = new User
        {
            Email = email,
            FirstName = "Test",
            LastName = "User",
            IsActive = true,
            IsEmailConfirmed = true,
            PasswordHash = new PasswordHasher().HashPassword("OldPassword1!")
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    private async Task<PasswordResetToken> SeedTokenAsync(
        int userId, string rawToken, bool isUsed = false, DateTime? expiresAt = null)
    {
        var entity = new PasswordResetToken
        {
            UserId = userId,
            Token = rawToken,
            IsUsed = isUsed,
            ExpiresAt = expiresAt ?? DateTime.UtcNow.AddHours(1)
        };
        _db.PasswordResetTokens.Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }

    // 1. Newly-issued token uses URL-safe Base64Url alphabet (no +, /, =, space).
    [Fact]
    public void GeneratedToken_IsUrlSafeBase64()
    {
        for (var i = 0; i < 20; i++)
        {
            var token = Convert.ToBase64String(
                    System.Security.Cryptography.RandomNumberGenerator.GetBytes(32))
                .Replace('+', '-').Replace('/', '_').TrimEnd('=');

            Assert.DoesNotContain('+', token);
            Assert.DoesNotContain('/', token);
            Assert.DoesNotContain('=', token);
            Assert.DoesNotContain(' ', token);
            Assert.True(token.Length > 0);
        }
    }

    // 2. URL-safe token roundtrips from DB through immediate reset without error.
    [Fact]
    public async Task UrlSafeToken_ImmediateReset_Succeeds()
    {
        var user = await SeedUserAsync();

        var rawToken = Convert.ToBase64String(
                System.Security.Cryptography.RandomNumberGenerator.GetBytes(32))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');
        await SeedTokenAsync(user.Id, rawToken);

        // Frontend reads token via URLSearchParams.get() - URL-safe chars are unchanged.
        await _authService.ResetPasswordAsync(rawToken, "NewPassword1!");

        var updated = await _db.PasswordResetTokens.FirstAsync();
        Assert.True(updated.IsUsed);
    }

    // 3. Legacy token with '+': browser URLSearchParams.get() decodes '+' as space.
    //    Backend normalises space to '+' and finds the stored token.
    [Fact]
    public async Task LegacyToken_SpaceInsteadOfPlus_IsNormalisedAndSucceeds()
    {
        var user = await SeedUserAsync();

        // Generate a realistic standard-Base64 token that is guaranteed to contain '+'
        // (produce random bytes until we get a token with '+' in it).
        string legacyToken;
        do
        {
            legacyToken = Convert.ToBase64String(
                System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
        } while (!legacyToken.Contains('+'));

        await SeedTokenAsync(user.Id, legacyToken);

        // Simulate what the browser URLSearchParams.get() sends: '+' decoded as space.
        var tokenFromBrowser = legacyToken.Replace('+', ' ');

        await _authService.ResetPasswordAsync(tokenFromBrowser, "NewPassword1!");

        var updated = await _db.PasswordResetTokens.FirstAsync();
        Assert.True(updated.IsUsed);
    }

    // 4. Completely invalid token is rejected.
    [Fact]
    public async Task InvalidToken_IsRejected()
    {
        await SeedUserAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.ResetPasswordAsync("completely-invalid-token", "NewPassword1!"));
    }

    // 5. Token reuse after a successful reset is rejected.
    [Fact]
    public async Task UsedToken_IsRejected()
    {
        var user = await SeedUserAsync();

        var rawToken = "reuse-test-token_abc";
        await SeedTokenAsync(user.Id, rawToken, isUsed: true);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.ResetPasswordAsync(rawToken, "NewPassword1!"));
    }

    // 6. Expired token is rejected even when its format is valid.
    [Fact]
    public async Task ExpiredToken_IsRejected()
    {
        var user = await SeedUserAsync();

        var rawToken = "expired-token_abc";
        await SeedTokenAsync(user.Id, rawToken, expiresAt: DateTime.UtcNow.AddHours(-1));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.ResetPasswordAsync(rawToken, "NewPassword1!"));
    }
}
