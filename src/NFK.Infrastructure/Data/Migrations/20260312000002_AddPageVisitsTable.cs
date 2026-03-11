using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using NFK.Infrastructure.Data;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    /// <summary>
    /// Creates the PageVisits table.
    ///
    /// The PageVisit entity was added to the EF model and DbContext (DbSet&lt;PageVisit&gt; PageVisits)
    /// but no migration was ever generated to create the physical table. This caused
    /// "Invalid object name 'PageVisits'" errors whenever code tried to DELETE FROM PageVisits
    /// (e.g. in UsersController.DeleteProfile).
    ///
    /// The migration is guarded with OBJECT_ID so it is idempotent and safe to re-run
    /// against a database that already has the table (e.g. created manually).
    /// </summary>
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260312000002_AddPageVisitsTable")]
    public partial class AddPageVisitsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID('PageVisits', 'U') IS NULL
BEGIN
    CREATE TABLE [PageVisits] (
        [Id]        INT            NOT NULL IDENTITY(1,1),
        [Page]      NVARCHAR(MAX)  NOT NULL,
        [UserId]    INT            NULL,
        [IpAddress] NVARCHAR(MAX)  NULL,
        [CreatedAt] DATETIME2      NOT NULL,
        [UpdatedAt] DATETIME2      NULL,
        [CreatedBy] NVARCHAR(MAX)  NULL,
        [UpdatedBy] NVARCHAR(MAX)  NULL,
        [IsDeleted] BIT            NOT NULL DEFAULT 0,
        CONSTRAINT [PK_PageVisits] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PageVisits_Users_UserId]
            FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
    );

    CREATE INDEX [IX_PageVisits_UserId] ON [PageVisits] ([UserId]);
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID('PageVisits', 'U') IS NOT NULL
BEGIN
    DROP TABLE [PageVisits];
END
");
        }
    }
}
