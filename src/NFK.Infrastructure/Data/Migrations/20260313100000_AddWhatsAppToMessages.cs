using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using NFK.Infrastructure.Data;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260313100000_AddWhatsAppToMessages")]
    public partial class AddWhatsAppToMessages : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Messages]') AND name = N'IsWhatsApp')
    ALTER TABLE [dbo].[Messages] ADD [IsWhatsApp] bit NOT NULL DEFAULT 0;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Messages]') AND name = N'WhatsAppMessageId')
    ALTER TABLE [dbo].[Messages] ADD [WhatsAppMessageId] nvarchar(200) NULL;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "WhatsAppMessageId", table: "Messages");
            migrationBuilder.DropColumn(name: "IsWhatsApp", table: "Messages");
        }
    }
}
