namespace NFK.Application.Utils;

/// <summary>
/// Provides canonical email normalization used consistently across all authentication flows.
/// Policy: trim leading/trailing whitespace, then lowercase-invariant.
/// Applying the same normalization at every entry point (register, login, forgot-password,
/// reset-password, resend-verification, admin update) ensures that identically-spelled
/// addresses are always stored and looked up under a single canonical form, preventing
/// the "user not found / duplicate key" contradiction caused by mixed-case or whitespace
/// variants of the same address.
/// </summary>
public static class EmailNormalizer
{
    /// <summary>
    /// Returns the canonical form of <paramref name="email"/>:
    /// leading/trailing whitespace removed, then converted to lowercase using
    /// the invariant culture.  Returns an empty string when the input is null or
    /// consists entirely of whitespace.
    /// </summary>
    public static string Normalize(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return string.Empty;

        return email.Trim().ToLowerInvariant();
    }
}
