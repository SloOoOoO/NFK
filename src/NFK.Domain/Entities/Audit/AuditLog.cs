using NFK.Domain.Common;

namespace NFK.Domain.Entities.Audit;

public class AuditLog : BaseEntity
{
    public int? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    // Navigation properties
    public virtual Users.User? User { get; set; }
}
