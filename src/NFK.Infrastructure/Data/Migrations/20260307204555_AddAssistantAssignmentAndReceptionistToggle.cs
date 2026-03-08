using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    public partial class AddAssistantAssignmentAndReceptionistToggle : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = N'ReceptionistCanSeeMessages')
    ALTER TABLE [dbo].[Users] ADD [ReceptionistCanSeeMessages] bit NOT NULL DEFAULT 1;
");

            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AssistantAssignments]') AND type = N'U')
BEGIN
    CREATE TABLE [dbo].[AssistantAssignments] (
        [Id] int NOT NULL IDENTITY(1,1),
        [AssistantUserId] int NOT NULL,
        [ConsultantUserId] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] nvarchar(max) NULL,
        [UpdatedBy] nvarchar(max) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AssistantAssignments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AssistantAssignments_Users_AssistantUserId] FOREIGN KEY ([AssistantUserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_AssistantAssignments_Users_ConsultantUserId] FOREIGN KEY ([ConsultantUserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE NO ACTION
    );
    CREATE UNIQUE INDEX [IX_AssistantAssignments_AssistantUserId] ON [dbo].[AssistantAssignments] ([AssistantUserId]);
    CREATE INDEX [IX_AssistantAssignments_ConsultantUserId] ON [dbo].[AssistantAssignments] ([ConsultantUserId]);
END
");
        }

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
