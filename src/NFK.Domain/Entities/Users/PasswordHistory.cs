using NFK.Domain.Common;

namespace NFK.Domain.Entities.Users;

public class PasswordHistory : BaseEntity
{
    public int UserId { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    public virtual User User { get; set; } = null!;
}
