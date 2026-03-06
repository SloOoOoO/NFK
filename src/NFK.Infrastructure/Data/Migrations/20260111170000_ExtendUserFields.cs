using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using NFK.Infrastructure.Data;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260111170000_ExtendUserFields")]
    public partial class ExtendUserFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use conditional SQL to guard against columns that may already exist
            // (e.g. when AddPasswordResetToken was previously applied on an existing DB).
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FullLegalName')
    ALTER TABLE [dbo].[Users] ADD [FullLegalName] nvarchar(200) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'DateOfBirth')
    ALTER TABLE [dbo].[Users] ADD [DateOfBirth] datetime2 NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'Address')
    ALTER TABLE [dbo].[Users] ADD [Address] nvarchar(500) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'City')
    ALTER TABLE [dbo].[Users] ADD [City] nvarchar(100) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'PostalCode')
    ALTER TABLE [dbo].[Users] ADD [PostalCode] nvarchar(20) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'Country')
    ALTER TABLE [dbo].[Users] ADD [Country] nvarchar(100) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'TaxId')
    ALTER TABLE [dbo].[Users] ADD [TaxId] nvarchar(50) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'PhoneVerified')
    ALTER TABLE [dbo].[Users] ADD [PhoneVerified] bit NOT NULL DEFAULT 0;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FirmLegalName')
    ALTER TABLE [dbo].[Users] ADD [FirmLegalName] nvarchar(200) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FirmTaxId')
    ALTER TABLE [dbo].[Users] ADD [FirmTaxId] nvarchar(50) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FirmChamberRegistration')
    ALTER TABLE [dbo].[Users] ADD [FirmChamberRegistration] nvarchar(100) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FirmAddress')
    ALTER TABLE [dbo].[Users] ADD [FirmAddress] nvarchar(500) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FirmCity')
    ALTER TABLE [dbo].[Users] ADD [FirmCity] nvarchar(100) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FirmPostalCode')
    ALTER TABLE [dbo].[Users] ADD [FirmPostalCode] nvarchar(20) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FirmCountry')
    ALTER TABLE [dbo].[Users] ADD [FirmCountry] nvarchar(100) NULL;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FullLegalName')
    ALTER TABLE [dbo].[Users] DROP COLUMN [FullLegalName];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'DateOfBirth')
    ALTER TABLE [dbo].[Users] DROP COLUMN [DateOfBirth];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'Address')
    ALTER TABLE [dbo].[Users] DROP COLUMN [Address];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'City')
    ALTER TABLE [dbo].[Users] DROP COLUMN [City];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'PostalCode')
    ALTER TABLE [dbo].[Users] DROP COLUMN [PostalCode];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'Country')
    ALTER TABLE [dbo].[Users] DROP COLUMN [Country];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'TaxId')
    ALTER TABLE [dbo].[Users] DROP COLUMN [TaxId];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'PhoneVerified')
    ALTER TABLE [dbo].[Users] DROP COLUMN [PhoneVerified];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FirmLegalName')
    ALTER TABLE [dbo].[Users] DROP COLUMN [FirmLegalName];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FirmTaxId')
    ALTER TABLE [dbo].[Users] DROP COLUMN [FirmTaxId];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FirmChamberRegistration')
    ALTER TABLE [dbo].[Users] DROP COLUMN [FirmChamberRegistration];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FirmAddress')
    ALTER TABLE [dbo].[Users] DROP COLUMN [FirmAddress];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FirmCity')
    ALTER TABLE [dbo].[Users] DROP COLUMN [FirmCity];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FirmPostalCode')
    ALTER TABLE [dbo].[Users] DROP COLUMN [FirmPostalCode];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'FirmCountry')
    ALTER TABLE [dbo].[Users] DROP COLUMN [FirmCountry];
");
        }
    }
}
