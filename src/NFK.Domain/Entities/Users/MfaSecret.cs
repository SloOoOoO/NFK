using NFK.Domain.Common;

namespace NFK.Domain.Entities.Users;

public class MfaSecret : BaseEntity
{
    public int UserId { get; set; }
    public string Secret { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public DateTime? EnabledAt { get; set; }
    public string[]? BackupCodes { get; set; }
    
    // Navigation property
    public virtual User User { get; set; } = null!;
}
