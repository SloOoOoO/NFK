using NFK.Domain.Common;

namespace NFK.Domain.Entities.Users;

public class UserSession : BaseEntity
{
    public int UserId { get; set; }
    public string SessionToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastActivityAt { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
}
