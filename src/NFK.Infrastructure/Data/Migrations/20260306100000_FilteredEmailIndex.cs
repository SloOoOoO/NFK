using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using NFK.Infrastructure.Data;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    /// <summary>
    /// Converts the <c>IX_Users_Email</c> unique index to a *filtered* unique index that only
    /// covers non-deleted rows (<c>WHERE IsDeleted = 0</c>).
    ///
    /// Without this fix, a soft-deleted user entry continues to block re-registration with
    /// the same email address even though the EF Core global query filter (<c>!IsDeleted</c>)
    /// makes the old record invisible to application queries.  The result is the contradictory
    /// "already exists" on register / "user not found" on login bug.
    ///
    /// With the filtered index:
    /// - Two different soft-deleted rows with the same email are still blocked (database safety).
    /// - A new active row can be inserted for an email whose previous row was soft-deleted.
    ///
    /// Note: SQL Server filtered indexes are not supported by all EF Core in-memory providers,
    /// so the application-level <c>IgnoreQueryFilters()</c> guards in <c>AuthService</c> remain
    /// the primary defence; this migration is an additional database-level safety net.
    /// </summary>
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260306100000_FilteredEmailIndex")]
    public partial class FilteredEmailIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the existing non-filtered unique index on Users.Email.
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            // Re-create it as a filtered unique index that excludes soft-deleted rows.
            // Active (non-deleted) users still cannot share an email address.
            // Soft-deleted rows are excluded so re-registration is unblocked.
            migrationBuilder.Sql(
                @"CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]) WHERE [IsDeleted] = 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove the filtered index.
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            // Restore the original non-filtered unique index.
            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }
    }
}
