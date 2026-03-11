using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using NFK.Infrastructure.Data;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    /// <summary>
    /// Data remediation migration: deletes the test/spam account suehansari@gmail.com
    /// and all associated child records from every related table.
    ///
    /// Deletion order respects foreign-key constraints (children before parent):
    ///   EmailVerificationTokens, PasswordHistories, PasswordResetTokens,
    ///   UserRoles, UserPermissions, RefreshTokens, UserSessions,
    ///   AuditLogs, LoginAttempts, Users.
    ///
    /// Rollback / operator notes
    /// -------------------------
    /// * Down() is intentionally empty – deleted data is not recoverable.
    /// * Take a database backup before applying if recovery may be needed.
    /// </summary>
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260311120000_RemoveTestUser")]
    public partial class RemoveTestUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Delete all child records first (FK order), then the user row itself.
            // Each statement is a no-op when the user does not exist.
            migrationBuilder.Sql(@"
DECLARE @UserId UNIQUEIDENTIFIER = (
    SELECT TOP 1 Id FROM Users WHERE Email = N'suehansari@gmail.com' AND IsDeleted = 0
);

IF @UserId IS NOT NULL
BEGIN
    DELETE FROM EmailVerificationTokens WHERE UserId = @UserId;
    DELETE FROM PasswordHistories       WHERE UserId = @UserId;
    DELETE FROM PasswordResetTokens     WHERE UserId = @UserId;
    DELETE FROM UserRoles               WHERE UserId = @UserId;
    DELETE FROM UserPermissions         WHERE UserId = @UserId;
    DELETE FROM RefreshTokens           WHERE UserId = @UserId;
    DELETE FROM UserSessions            WHERE UserId = @UserId;
    DELETE FROM AuditLogs               WHERE UserId = @UserId;
    DELETE FROM LoginAttempts           WHERE Email  = N'suehansari@gmail.com';
    DELETE FROM Users                   WHERE Id     = @UserId;
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally empty: deleted user data is not recoverable.
            // Restore from a pre-migration backup if needed.
        }
    }
}
