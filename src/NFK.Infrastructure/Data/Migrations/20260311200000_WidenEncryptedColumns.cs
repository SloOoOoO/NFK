using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using NFK.Infrastructure.Data;

#nullable disable

namespace NFK.Infrastructure.Data.Migrations
{
    /// <summary>
    /// Widens all encrypted PII columns in the Users table to nvarchar(max).
    ///
    /// These columns store AES-256-GCM ciphertext (12-byte nonce + 16-byte auth tag +
    /// plaintext, Base64-encoded), which is significantly longer than the original
    /// plaintext values. The original migration (ExtendUserFields) used tight
    /// nvarchar(N) sizes that cause "String or binary data would be truncated" errors
    /// at registration time.
    ///
    /// Each ALTER is guarded by a sys.columns check (max_length = -1 means nvarchar(max))
    /// so the migration is idempotent and safe to re-run.
    ///
    /// Down() is intentionally empty — shrinking columns back would risk data loss.
    /// </summary>
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260311200000_WidenEncryptedColumns")]
    public partial class WidenEncryptedColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Widen columns that store AES-256-GCM encrypted data (Base64-encoded).
            // The guard (max_length <> -1) evaluates to false when the column is already
            // nvarchar(max) (SQL Server stores -1 for max), making each ALTER a no-op on
            // a fully-migrated database.
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = N'PostalCode' AND max_length <> -1)
    ALTER TABLE [dbo].[Users] ALTER COLUMN [PostalCode] nvarchar(max) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = N'City' AND max_length <> -1)
    ALTER TABLE [dbo].[Users] ALTER COLUMN [City] nvarchar(max) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = N'Address' AND max_length <> -1)
    ALTER TABLE [dbo].[Users] ALTER COLUMN [Address] nvarchar(max) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = N'FullLegalName' AND max_length <> -1)
    ALTER TABLE [dbo].[Users] ALTER COLUMN [FullLegalName] nvarchar(max) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = N'TaxId' AND max_length <> -1)
    ALTER TABLE [dbo].[Users] ALTER COLUMN [TaxId] nvarchar(max) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = N'FirmLegalName' AND max_length <> -1)
    ALTER TABLE [dbo].[Users] ALTER COLUMN [FirmLegalName] nvarchar(max) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = N'FirmTaxId' AND max_length <> -1)
    ALTER TABLE [dbo].[Users] ALTER COLUMN [FirmTaxId] nvarchar(max) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = N'FirmChamberRegistration' AND max_length <> -1)
    ALTER TABLE [dbo].[Users] ALTER COLUMN [FirmChamberRegistration] nvarchar(max) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = N'FirmAddress' AND max_length <> -1)
    ALTER TABLE [dbo].[Users] ALTER COLUMN [FirmAddress] nvarchar(max) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = N'FirmCity' AND max_length <> -1)
    ALTER TABLE [dbo].[Users] ALTER COLUMN [FirmCity] nvarchar(max) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = N'FirmPostalCode' AND max_length <> -1)
    ALTER TABLE [dbo].[Users] ALTER COLUMN [FirmPostalCode] nvarchar(max) NULL;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally empty: shrinking encrypted columns back to their original
            // sizes would truncate existing ciphertext and corrupt data.
        }
    }
}
