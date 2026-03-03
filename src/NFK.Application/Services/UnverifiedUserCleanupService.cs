using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NFK.Infrastructure.Data;

namespace NFK.Application.Services;

/// <summary>
/// Hangfire background job that deletes users who did not verify their email within 24 hours.
/// Scheduled to run hourly via RecurringJob in Program.cs.
/// </summary>
public class UnverifiedUserCleanupService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UnverifiedUserCleanupService> _logger;

    public UnverifiedUserCleanupService(
        ApplicationDbContext context,
        ILogger<UnverifiedUserCleanupService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Deletes all users whose email verification token has expired (> 24 hours)
    /// and whose email address has still not been confirmed.
    /// </summary>
    public async Task DeleteExpiredUnverifiedUsersAsync()
    {
        _logger.LogInformation("Starting cleanup of expired unverified users");

        // Find all expired, unused verification tokens
        var expiredTokens = await _context.EmailVerificationTokens
            .Include(t => t.User)
            .Where(t => !t.IsUsed && t.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

        var deletedCount = 0;

        foreach (var token in expiredTokens)
        {
            var user = token.User;
            if (user == null || user.IsEmailConfirmed)
            {
                // Token orphaned or user already verified – just clean up the token
                _context.EmailVerificationTokens.Remove(token);
                continue;
            }

            _logger.LogInformation(
                "Removing unverified user {UserId} ({Email}) – verification expired at {ExpiresAt}",
                user.Id, user.Email, token.ExpiresAt);

            // Remove dependent records first to avoid FK violations
            var userRoles = _context.UserRoles.Where(ur => ur.UserId == user.Id);
            _context.UserRoles.RemoveRange(userRoles);

            var refreshTokens = _context.RefreshTokens.Where(rt => rt.UserId == user.Id);
            _context.RefreshTokens.RemoveRange(refreshTokens);

            var passwordHistories = _context.PasswordHistories.Where(ph => ph.UserId == user.Id);
            _context.PasswordHistories.RemoveRange(passwordHistories);

            var passwordResetTokens = _context.PasswordResetTokens.Where(prt => prt.UserId == user.Id);
            _context.PasswordResetTokens.RemoveRange(passwordResetTokens);

            _context.EmailVerificationTokens.Remove(token);
            _context.Users.Remove(user);
            deletedCount++;
        }

        if (deletedCount > 0 || expiredTokens.Count > 0)
        {
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation(
            "Unverified user cleanup complete: {DeletedCount} user(s) removed, {TokenCount} expired token(s) processed",
            deletedCount, expiredTokens.Count);
    }
}
