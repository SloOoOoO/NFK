using NFK.Domain.Common;

namespace NFK.Domain.Entities.Audit;

public class AuditLog : BaseEntity
{
    public int? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    
    /// <summary>
    /// Type of entity being audited (e.g., "Document", "Client", "Case")
    /// </summary>
    public string EntityType { get; set; } = string.Empty;
    
    /// <summary>
    /// Legacy field - use EntityType instead
    /// </summary>
    public string EntityName { get; set; } = string.Empty;
    
    public int? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    
    /// <summary>
    /// Additional details about the action in JSON format
    /// </summary>
    public string? Details { get; set; }
    
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    // Navigation properties
    public virtual Users.User? User { get; set; }
}
