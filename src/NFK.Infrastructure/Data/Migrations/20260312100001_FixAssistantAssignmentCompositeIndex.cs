using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    public partial class FixAssistantAssignmentCompositeIndex : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AssistantAssignments_AssistantUserId' AND object_id = OBJECT_ID(N'[dbo].[AssistantAssignments]'))
    DROP INDEX [IX_AssistantAssignments_AssistantUserId] ON [dbo].[AssistantAssignments];
");

            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AssistantAssignments_AssistantUserId_ConsultantUserId' AND object_id = OBJECT_ID(N'[dbo].[AssistantAssignments]'))
    CREATE UNIQUE INDEX [IX_AssistantAssignments_AssistantUserId_ConsultantUserId] ON [dbo].[AssistantAssignments] ([AssistantUserId], [ConsultantUserId]);
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AssistantAssignments_AssistantUserId_ConsultantUserId' AND object_id = OBJECT_ID(N'[dbo].[AssistantAssignments]'))
    DROP INDEX [IX_AssistantAssignments_AssistantUserId_ConsultantUserId] ON [dbo].[AssistantAssignments];
");

            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AssistantAssignments_AssistantUserId' AND object_id = OBJECT_ID(N'[dbo].[AssistantAssignments]'))
    CREATE UNIQUE INDEX [IX_AssistantAssignments_AssistantUserId] ON [dbo].[AssistantAssignments] ([AssistantUserId]);
");
        }
    }
}
