using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NFK.Application.Interfaces;
using NFK.Application.Services;
using NFK.Application.Utils;
using NFK.Domain.Entities.Users;
using NFK.Infrastructure.Data;
using NFK.Infrastructure.Security;

namespace NFK.Tests.Auth;

/// <summary>
/// Tests verifying that email normalization (trim + lowercase) is applied consistently
/// across all authentication flows, eliminating the "user not found / duplicate key"
/// contradiction caused by mixed-case or whitespace variants of the same address.
/// </summary>
public class EmailNormalizationTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly AuthService _authService;
    private readonly Mock<IEmailService> _emailMock;

    public EmailNormalizationTests()
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
            _emailMock.Object, cacheMock.Object);
    }

    public void Dispose() => _db.Dispose();

    // ── EmailNormalizer unit tests ────────────────────────────────────────────

    [Theory]
    [InlineData("user@example.com", "user@example.com")]
    [InlineData("USER@EXAMPLE.COM", "user@example.com")]
    [InlineData("User@Example.Com", "user@example.com")]
    [InlineData("  user@example.com  ", "user@example.com")]
    [InlineData("  USER@EXAMPLE.COM  ", "user@example.com")]
    [InlineData("TESTUSER@EXAMPLE.COM", "testuser@example.com")]
    [InlineData(" Testuser@Example.com ", "testuser@example.com")]
    public void NormalizeEmail_ReturnsLowercaseTrimmed(string input, string expected)
    {
        Assert.Equal(expected, EmailNormalizer.Normalize(input));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void NormalizeEmail_NullOrWhitespace_ReturnsEmpty(string? input)
    {
        Assert.Equal(string.Empty, EmailNormalizer.Normalize(input));
    }

    // ── Login normalization ───────────────────────────────────────────────────

    /// <summary>
    /// Login must succeed even when the supplied email has a different case than
    /// the stored canonical form – the root cause of the reported "user not found"
    /// bug.
    /// </summary>
    [Theory]
    [InlineData("testuser@example.com")]
    [InlineData("TESTUSER@EXAMPLE.COM")]
    [InlineData("Testuser@Example.com")]
    [InlineData("  testuser@example.com  ")]
    public async Task Login_EmailVariants_FindStoredNormalizedUser(string loginEmail)
    {
        // Seed a user stored with the canonical (already-normalised) email
        var passwordHasher = new PasswordHasher();
        _db.Users.Add(new User
        {
            Email = "testuser@example.com",
            FirstName = "Test",
            LastName = "User",
            IsActive = true,
            IsEmailConfirmed = true,
            PasswordHash = passwordHasher.HashPassword("Password1!Abcd")
        });
        await _db.SaveChangesAsync();

        var request = new NFK.Application.DTOs.Auth.LoginRequest(loginEmail, "Password1!Abcd");
        var result = await _authService.LoginAsync(request);

        Assert.NotNull(result);
        Assert.Equal("testuser@example.com", result.User.Email);
    }

    // ── Registration normalization ────────────────────────────────────────────

    [Fact]
    public async Task Register_StoresNormalizedEmail()
    {
        _emailMock
            .Setup(e => e.SendEmailVerificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        var request = BuildRegisterRequest("USER@EXAMPLE.COM");
        await _authService.RegisterAsync(request);

        var user = await _db.Users.FirstAsync();
        Assert.Equal("user@example.com", user.Email);
    }

    [Fact]
    public async Task Register_LeadingTrailingSpaces_StoresNormalizedEmail()
    {
        _emailMock
            .Setup(e => e.SendEmailVerificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        var request = BuildRegisterRequest("  user@example.com  ");
        await _authService.RegisterAsync(request);

        var user = await _db.Users.FirstAsync();
        Assert.Equal("user@example.com", user.Email);
    }

    /// <summary>
    /// Registering with a case variant of an already-registered email should throw
    /// InvalidOperationException (mapped to 409 by the controller) rather than
    /// letting a raw duplicate-key exception propagate as a 500.
    /// Covers the reported "Cannot insert duplicate key row" scenario.
    /// </summary>
    [Theory]
    [InlineData("testuser@example.com")]
    [InlineData("TESTUSER@EXAMPLE.COM")]
    [InlineData("Testuser@Example.com")]
    [InlineData("  Testuser@Example.com  ")]
    public async Task Register_DuplicateEmailVariant_ThrowsInvalidOperationException(string duplicateEmail)
    {
        _emailMock
            .Setup(e => e.SendEmailVerificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // First registration succeeds
        await _authService.RegisterAsync(BuildRegisterRequest("testuser@example.com"));

        // Second registration with any case/whitespace variant must return a controlled error
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _authService.RegisterAsync(BuildRegisterRequest(duplicateEmail)));

        Assert.Contains("already exists", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    // ── Forgot-password normalization ─────────────────────────────────────────

    [Theory]
    [InlineData("RESET@EXAMPLE.COM")]
    [InlineData("Reset@Example.Com")]
    [InlineData("  reset@example.com  ")]
    public async Task ForgotPassword_EmailVariant_FindsUser(string inputEmail)
    {
        var passwordHasher = new PasswordHasher();
        _db.Users.Add(new User
        {
            Email = "reset@example.com",
            FirstName = "Reset",
            LastName = "User",
            IsActive = true,
            IsEmailConfirmed = true,
            PasswordHash = passwordHasher.HashPassword("Password1!Abcd")
        });
        await _db.SaveChangesAsync();

        _emailMock
            .Setup(e => e.SendPasswordResetEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // Should NOT throw – user is found via normalized lookup
        var token = await _authService.RequestPasswordResetAsync(inputEmail);
        Assert.False(string.IsNullOrEmpty(token));
    }

    // ── Resend-verification normalization ─────────────────────────────────────

    [Theory]
    [InlineData("UNVERIFIED@EXAMPLE.COM")]
    [InlineData("Unverified@Example.Com")]
    [InlineData("  unverified@example.com  ")]
    public async Task ResendVerification_EmailVariant_SendsEmail(string inputEmail)
    {
        var passwordHasher = new PasswordHasher();
        _db.Users.Add(new User
        {
            Email = "unverified@example.com",
            FirstName = "Test",
            LastName = "User",
            IsActive = true,
            IsEmailConfirmed = false,
            PasswordHash = passwordHasher.HashPassword("Password1!Abcd")
        });
        await _db.SaveChangesAsync();

        _emailMock
            .Setup(e => e.SendEmailVerificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        await _authService.ResendVerificationEmailAsync(inputEmail);

        _emailMock.Verify(
            e => e.SendEmailVerificationAsync("unverified@example.com", It.IsAny<string>(), It.IsAny<string>()),
            Times.Once);
    }

    // ── Three-way consistency ─────────────────────────────────────────────────

    /// <summary>
    /// Reproduces the exact three-way contradiction reported in the issue:
    /// for the SAME email (and case/whitespace variants) of an existing but
    /// unverified account:
    ///  1. register   → 409 / InvalidOperationException "already exists"
    ///  2. login      → UnauthorizedAccessException containing "verify your email"
    ///                  (user WAS found; not "Invalid email or password" / "user not found")
    ///  3. resend     → email is sent exactly once (not "no account" silent return)
    ///
    /// The test guards against regression of the normalization mismatch that
    /// caused the original "user not found / duplicate key" contradiction for
    /// testuser@example.com.
    /// </summary>
    [Theory]
    [InlineData("testuser@example.com")]
    [InlineData("TESTUSER@EXAMPLE.COM")]
    [InlineData("Testuser@Example.com")]
    [InlineData("  testuser@example.com  ")]
    public async Task ThreeWay_ExistingUnverifiedUser_AllFlowsConsistent(string inputEmail)
    {
        // Arrange – seed an unverified user stored under the canonical email.
        var passwordHasher = new PasswordHasher();
        _db.Users.Add(new User
        {
            Email = "testuser@example.com",
            FirstName = "Test",
            LastName = "User",
            IsActive = true,
            IsEmailConfirmed = false,
            PasswordHash = passwordHasher.HashPassword("Password1!Abcd")
        });
        await _db.SaveChangesAsync();

        _emailMock
            .Setup(e => e.SendEmailVerificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // 1. Register with same email (any variant) must return a controlled duplicate conflict,
        //    NOT a raw database exception.
        var regEx = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _authService.RegisterAsync(BuildRegisterRequest(inputEmail)));
        Assert.Contains("already exists", regEx.Message, StringComparison.OrdinalIgnoreCase);

        // 2. Login must locate the account and fail specifically because the email is
        //    not yet verified – NOT because "user not found".
        //    The expected message confirms the account was found and the verification
        //    branch was reached.
        var loginEx = await Assert.ThrowsAsync<NFK.Application.Exceptions.EmailNotVerifiedException>(
            () => _authService.LoginAsync(new NFK.Application.DTOs.Auth.LoginRequest(inputEmail, "Password1!Abcd")));
        Assert.Contains("verify your email", loginEx.Message, StringComparison.OrdinalIgnoreCase);

        // 3. Resend-verification must reach the account and send exactly one email.
        //    A silent return here would indicate "no account found" which is the bug.
        await _authService.ResendVerificationEmailAsync(inputEmail);

        _emailMock.Verify(
            e => e.SendEmailVerificationAsync("testuser@example.com", It.IsAny<string>(), It.IsAny<string>()),
            Times.Once);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static NFK.Application.DTOs.Auth.RegisterRequest BuildRegisterRequest(string email) =>
        new NFK.Application.DTOs.Auth.RegisterRequest(
            Email: email,
            Password: "Password1!Abcd",
            FirstName: "Test",
            LastName: "User");
}
