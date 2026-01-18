using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMfaSecretBackupCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "BackupCodes",
                table: "MfaSecrets",
                newName: "BackupCodesHashed");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "BackupCodesHashed",
                table: "MfaSecrets",
                newName: "BackupCodes");
        }
    }
}
