using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using NFK.Infrastructure.Data;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260303000003_AddMissingColumns")]
    public partial class AddMissingColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add Gender column to Users (was in model but never migrated)
            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            // Add IsPoolEmail column to Messages (was in model but never migrated)
            migrationBuilder.AddColumn<bool>(
                name: "IsPoolEmail",
                table: "Messages",
                type: "bit",
                nullable: false,
                defaultValue: false);

            // Add RecipientRoles column to Messages (was in model but never migrated)
            migrationBuilder.AddColumn<string>(
                name: "RecipientRoles",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: true);

            // Change SenderUserId in Messages from non-nullable to nullable
            migrationBuilder.AlterColumn<int>(
                name: "SenderUserId",
                table: "Messages",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsPoolEmail",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "RecipientRoles",
                table: "Messages");

            // Set NULL SenderUserId values to 0 before making column non-nullable
            migrationBuilder.Sql("UPDATE Messages SET SenderUserId = 0 WHERE SenderUserId IS NULL");

            migrationBuilder.AlterColumn<int>(
                name: "SenderUserId",
                table: "Messages",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
