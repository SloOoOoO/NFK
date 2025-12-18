using NFK.Domain.Common;

namespace NFK.Domain.Entities.Clients;

public class CaseNote : BaseEntity
{
    public int CaseId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsInternal { get; set; }

    // Navigation properties
    public virtual Case Case { get; set; } = null!;
}
