using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRegisteredUserRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add RegisteredUser role to the Roles table
            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Name", "Description", "IsSystemRole", "CreatedAt", "UpdatedAt" },
                values: new object[] { 7, "RegisteredUser", "New users who have registered but are not yet assigned a specific role", true, DateTime.UtcNow, DateTime.UtcNow });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove RegisteredUser role
            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 7);
        }
    }
}
