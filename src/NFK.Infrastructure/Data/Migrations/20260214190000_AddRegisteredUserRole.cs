using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using NFK.Infrastructure.Data;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260214190000_AddRegisteredUserRole")]
    public partial class AddRegisteredUserRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add RegisteredUser role using raw SQL to avoid EF entity-mapping requirement
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM [Roles] WHERE [Id] = 7)
                BEGIN
                    SET IDENTITY_INSERT [Roles] ON;
                    INSERT INTO [Roles] ([Id], [Name], [Description], [IsSystemRole], [CreatedAt], [UpdatedAt], [IsDeleted], [CreatedBy], [UpdatedBy])
                    VALUES (7, N'RegisteredUser', N'New users who have registered but are not yet assigned a specific role', 1, '2026-02-14T19:00:00.0000000', '2026-02-14T19:00:00.0000000', 0, NULL, NULL);
                    SET IDENTITY_INSERT [Roles] OFF;
                END");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove RegisteredUser role
            migrationBuilder.Sql("DELETE FROM [Roles] WHERE [Id] = 7;");
        }
    }
}
