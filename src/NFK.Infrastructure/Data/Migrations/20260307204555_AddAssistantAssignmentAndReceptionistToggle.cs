using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAssistantAssignmentAndReceptionistToggle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ReceptionistCanSeeMessages",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateTable(
                name: "AssistantAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AssistantUserId = table.Column<int>(type: "int", nullable: false),
                    ConsultantUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssistantAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssistantAssignments_Users_AssistantUserId",
                        column: x => x.AssistantUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssistantAssignments_Users_ConsultantUserId",
                        column: x => x.ConsultantUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssistantAssignments_AssistantUserId",
                table: "AssistantAssignments",
                column: "AssistantUserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssistantAssignments_ConsultantUserId",
                table: "AssistantAssignments",
                column: "ConsultantUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssistantAssignments");

            migrationBuilder.DropColumn(
                name: "ReceptionistCanSeeMessages",
                table: "Users");
        }
    }
}
