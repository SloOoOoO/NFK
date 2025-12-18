using NFK.Domain.Common;
using NFK.Domain.Enums;

namespace NFK.Domain.Entities.Clients;

public class CaseStatusHistory : BaseEntity
{
    public int CaseId { get; set; }
    public CaseStatus PreviousStatus { get; set; }
    public CaseStatus NewStatus { get; set; }
    public string? Comment { get; set; }

    // Navigation properties
    public virtual Case Case { get; set; } = null!;
}
