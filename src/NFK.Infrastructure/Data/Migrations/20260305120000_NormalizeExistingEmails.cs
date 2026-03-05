using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using NFK.Infrastructure.Data;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    /// <summary>
    /// Data remediation migration: normalizes all existing User.Email values to their
    /// canonical form (LTRIM + RTRIM + LOWER) so they are consistent with the
    /// application-level EmailNormalizer.Normalize() applied to every new write.
    ///
    /// Collision handling
    /// ------------------
    /// If two rows would resolve to the same normalized email (e.g. "User@x.com" and
    /// "user@x.com" already exist as separate rows) the UPDATE is NOT run; instead the
    /// migration raises an informational error and aborts with RAISERROR so the operator
    /// knows manual remediation is required before retrying.
    ///
    /// Rollback / operator notes
    /// -------------------------
    /// * There is intentionally no Down() body that reverses individual email changes
    ///   because the original mixed-case values are lost after a forward migration.
    /// * Before running, take a database backup.
    /// * If the migration fails with "Email normalization collision detected", run the
    ///   diagnostic query below to identify the conflicting rows, merge or remove
    ///   duplicates manually, then retry:
    ///
    ///     SELECT LOWER(LTRIM(RTRIM(Email))) AS NormalizedEmail, COUNT(*) AS Cnt,
    ///            STRING_AGG(CAST(Id AS VARCHAR), ', ') AS UserIds
    ///     FROM Users
    ///     GROUP BY LOWER(LTRIM(RTRIM(Email)))
    ///     HAVING COUNT(*) > 1;
    /// </summary>
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260305120000_NormalizeExistingEmails")]
    public partial class NormalizeExistingEmails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Detect collisions: two rows that normalize to the same email.
            //    If any exist the migration aborts with a clear actionable message.
            //    Diagnostic query to identify duplicates:
            //      SELECT LOWER(LTRIM(RTRIM(Email))) AS NormalizedEmail, COUNT(*) AS Cnt,
            //             STRING_AGG(CAST(Id AS VARCHAR), ', ') AS UserIds
            //      FROM Users GROUP BY LOWER(LTRIM(RTRIM(Email))) HAVING COUNT(*) > 1;
            migrationBuilder.Sql(@"
IF EXISTS (
    SELECT 1
    FROM Users
    GROUP BY LOWER(LTRIM(RTRIM(Email)))
    HAVING COUNT(*) > 1
)
BEGIN
    DECLARE @msg NVARCHAR(2048) = N'Email normalization collision detected: two or more rows in [Users] would map to the same normalized email. Merge or remove the duplicate rows, then re-apply this migration. Run diagnostic: SELECT LOWER(LTRIM(RTRIM(Email))) AS NormalizedEmail, COUNT(*) AS Cnt FROM Users GROUP BY LOWER(LTRIM(RTRIM(Email))) HAVING COUNT(*) > 1';
    THROW 50000, @msg, 1;
END
");

            // 2. Normalize all emails: trim whitespace and convert to lowercase
            migrationBuilder.Sql(@"
UPDATE Users
SET Email = LOWER(LTRIM(RTRIM(Email)))
WHERE Email <> LOWER(LTRIM(RTRIM(Email)));
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally empty: the original mixed-case/whitespace values are not
            // recoverable once overwritten.  Restore from a pre-migration backup if needed.
        }
    }
}
