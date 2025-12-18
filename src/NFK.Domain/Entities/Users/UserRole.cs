using NFK.Domain.Common;

namespace NFK.Domain.Entities.Users;

public class UserRole : BaseEntity
{
    public int UserId { get; set; }
    public int RoleId { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Role Role { get; set; } = null!;
}
