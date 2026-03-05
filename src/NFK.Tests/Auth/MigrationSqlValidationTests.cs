using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using NFK.Infrastructure.Data.Migrations;
using System.Text.RegularExpressions;

namespace NFK.Tests.Auth;

/// <summary>
/// Validates that migration SQL is syntactically safe for SQL Server.
/// Specifically guards against using string concatenation inside RAISERROR()
/// which causes "Incorrect syntax near '+'" at runtime.
/// </summary>
public class MigrationSqlValidationTests
{
    private static IReadOnlyList<MigrationOperation> GetMigrationOperations()
    {
        var migration = new NormalizeExistingEmails();
        return migration.UpOperations;
    }

    [Fact]
    public void NormalizeExistingEmails_Up_ProducesAtLeastOneSqlOperation()
    {
        var ops = GetMigrationOperations();
        Assert.NotEmpty(ops);
        Assert.All(ops, op => Assert.IsType<SqlOperation>(op));
    }

    /// <summary>
    /// SQL Server does not allow expression concatenation (+) as the first argument
    /// to RAISERROR(). This test ensures the migration never uses that pattern.
    /// Uses a regex to specifically match RAISERROR(...+...) rather than any '+' in SQL.
    /// </summary>
    [Fact]
    public void NormalizeExistingEmails_Up_NoStringConcatenationInsideRaiserror()
    {
        var ops = GetMigrationOperations();
        foreach (var op in ops.OfType<SqlOperation>())
        {
            var sql = op.Sql ?? string.Empty;
            // Matches RAISERROR( ... + ... ) — any '+' operator inside a RAISERROR call
            var hasConcatInRaiserror = Regex.IsMatch(
                sql,
                @"RAISERROR\s*\([^)]*\+[^)]*\)",
                RegexOptions.IgnoreCase | RegexOptions.Singleline);
            Assert.False(hasConcatInRaiserror,
                "RAISERROR must not use '+' string concatenation in its argument list. " +
                "Use THROW with a pre-assembled variable instead.");
        }
    }

    /// <summary>
    /// The preferred replacement for RAISERROR with dynamic messages is THROW.
    /// Verifies that the collision guard uses THROW.
    /// </summary>
    [Fact]
    public void NormalizeExistingEmails_Up_CollisionGuardUsesThrow()
    {
        var ops = GetMigrationOperations();
        var allSql = string.Concat(ops.OfType<SqlOperation>().Select(o => o.Sql));

        Assert.Contains("THROW", allSql, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Verifies the collision guard is still present and checks for duplicates.
    /// </summary>
    [Fact]
    public void NormalizeExistingEmails_Up_ContainsCollisionCheck()
    {
        var ops = GetMigrationOperations();
        var allSql = string.Concat(ops.OfType<SqlOperation>().Select(o => o.Sql));

        Assert.Contains("HAVING COUNT(*) > 1", allSql, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Verifies that the normalization UPDATE statement is present.
    /// </summary>
    [Fact]
    public void NormalizeExistingEmails_Up_ContainsNormalizationUpdate()
    {
        var ops = GetMigrationOperations();
        var allSql = string.Concat(ops.OfType<SqlOperation>().Select(o => o.Sql));

        Assert.Contains("UPDATE Users", allSql, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("LOWER(LTRIM(RTRIM(Email)))", allSql, StringComparison.OrdinalIgnoreCase);
    }
}
