using NFK.Domain.Common;

namespace NFK.Domain.Entities.Analytics;

public class PageVisit : BaseEntity
{
    public string Page { get; set; } = string.Empty;
    public int? UserId { get; set; }
    public string? IpAddress { get; set; }

    // Navigation properties
    public virtual Users.User? User { get; set; }
}
