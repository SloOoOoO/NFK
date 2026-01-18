using NFK.Domain.Common;

namespace NFK.Domain.Entities.Users;

public class MfaSecret : BaseEntity
{
    public int UserId { get; set; }
    public string Secret { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public DateTime? EnabledAt { get; set; }
    
    /// <summary>
    /// Hashed backup codes (use PasswordHasher to hash before storage)
    /// Store as JSON array of hashed codes
    /// </summary>
    public string[]? BackupCodesHashed { get; set; }
    
    // Navigation property
    public virtual User User { get; set; } = null!;
}
