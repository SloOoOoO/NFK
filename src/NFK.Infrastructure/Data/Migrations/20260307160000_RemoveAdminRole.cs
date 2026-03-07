using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using NFK.Infrastructure.Data;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260307160000_RemoveAdminRole")]
    public partial class RemoveAdminRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Migrate any users with the Admin role to SuperAdmin
            migrationBuilder.Sql(@"
                UPDATE ur
                SET ur.[RoleId] = (SELECT TOP 1 [Id] FROM [Roles] WHERE [Name] = 'SuperAdmin')
                FROM [UserRoles] ur
                INNER JOIN [Roles] r ON ur.[RoleId] = r.[Id]
                WHERE r.[Name] = 'Admin'
                  AND EXISTS (SELECT 1 FROM [Roles] WHERE [Name] = 'SuperAdmin');");

            // Remove the Admin role
            migrationBuilder.Sql("DELETE FROM [Roles] WHERE [Name] = 'Admin';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Re-add the Admin role (Id 6 as originally seeded)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM [Roles] WHERE [Name] = 'Admin')
                BEGIN
                    INSERT INTO [Roles] ([Name], [Description], [IsSystemRole], [CreatedAt], [UpdatedAt], [IsDeleted], [CreatedBy], [UpdatedBy])
                    VALUES (N'Admin', N'General admin role', 1, '2026-03-07T16:00:00.0000000', '2026-03-07T16:00:00.0000000', 0, NULL, NULL);
                END");
        }
    }
}
