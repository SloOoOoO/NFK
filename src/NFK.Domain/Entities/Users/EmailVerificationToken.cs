using NFK.Domain.Common;

namespace NFK.Domain.Entities.Users;

public class EmailVerificationToken : BaseEntity
{
    public int UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTime? UsedAt { get; set; }

    // Navigation properties
    public virtual User? User { get; set; }
}
