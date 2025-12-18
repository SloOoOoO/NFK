using NFK.Domain.Common;

namespace NFK.Domain.Entities.Users;

public class UserPermission : BaseEntity
{
    public int UserId { get; set; }
    public int PermissionId { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Permission Permission { get; set; } = null!;
}
