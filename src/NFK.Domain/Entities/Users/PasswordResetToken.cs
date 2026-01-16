using NFK.Domain.Common;

namespace NFK.Domain.Entities.Users;

public class PasswordResetToken : BaseEntity
{
    public int UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
}
