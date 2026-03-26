using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    public partial class RemoveWhatsAppFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Messages]') AND name = N'WhatsAppMessageId')
    ALTER TABLE [dbo].[Messages] DROP COLUMN [WhatsAppMessageId];
");

            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Messages]') AND name = N'IsWhatsApp')
    ALTER TABLE [dbo].[Messages] DROP COLUMN [IsWhatsApp];
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Messages]') AND name = N'IsWhatsApp')
    ALTER TABLE [dbo].[Messages] ADD [IsWhatsApp] bit NOT NULL DEFAULT 0;
");

            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Messages]') AND name = N'WhatsAppMessageId')
    ALTER TABLE [dbo].[Messages] ADD [WhatsAppMessageId] nvarchar(max) NULL;
");
        }
    }
}
