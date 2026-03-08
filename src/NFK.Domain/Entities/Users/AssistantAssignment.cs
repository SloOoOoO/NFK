using NFK.Domain.Common;

namespace NFK.Domain.Entities.Users;

public class AssistantAssignment : BaseEntity
{
    public int AssistantUserId { get; set; }
    public int ConsultantUserId { get; set; }

    // Navigation properties
    public virtual User AssistantUser { get; set; } = null!;
    public virtual User ConsultantUser { get; set; } = null!;
}
