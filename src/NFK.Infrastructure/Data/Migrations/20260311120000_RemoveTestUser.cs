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
    ///   EmailVerificationTokens, PasswordResetTokens, RefreshTokens, UserSessions,
    ///   UserRoles, UserPermissions, AuditLogs, PageVisits, Notifications,
    ///   PasswordHistories, Messages, Documents, Clients, Users.
    ///   LoginAttempts is deleted by email (no UserId FK).
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
DECLARE @UserId INT = (
    SELECT TOP 1 Id FROM Users WHERE Email = N'suehansari@gmail.com'
);

IF @UserId IS NOT NULL
BEGIN
    DELETE FROM EmailVerificationTokens WHERE UserId = @UserId;
    DELETE FROM PasswordResetTokens     WHERE UserId = @UserId;
    DELETE FROM RefreshTokens           WHERE UserId = @UserId;
    DELETE FROM UserSessions            WHERE UserId = @UserId;
    DELETE FROM UserRoles               WHERE UserId = @UserId;
    DELETE FROM UserPermissions         WHERE UserId = @UserId;
    DELETE FROM AuditLogs               WHERE UserId = @UserId;

    IF OBJECT_ID('PageVisits', 'U') IS NOT NULL
        DELETE FROM PageVisits WHERE UserId = @UserId;

    IF OBJECT_ID('Notifications', 'U') IS NOT NULL
        DELETE FROM Notifications WHERE UserId = @UserId;

    IF OBJECT_ID('PasswordHistories', 'U') IS NOT NULL
        DELETE FROM PasswordHistories WHERE UserId = @UserId;

    IF OBJECT_ID('Messages', 'U') IS NOT NULL
        DELETE FROM Messages WHERE SenderUserId = @UserId OR RecipientUserId = @UserId;

    IF OBJECT_ID('Documents', 'U') IS NOT NULL
        DELETE FROM Documents WHERE UploadedByUserId = @UserId;

    IF OBJECT_ID('Clients', 'U') IS NOT NULL
        DELETE FROM Clients WHERE UserId = @UserId;

    DELETE FROM Users WHERE Id = @UserId;
END

-- Clean up login attempts by email (no UserId FK)
IF OBJECT_ID('LoginAttempts', 'U') IS NOT NULL
    DELETE FROM LoginAttempts WHERE Email = N'suehansari@gmail.com';
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
