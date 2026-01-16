using NFK.Domain.Common;
using NFK.Domain.Enums;

namespace NFK.Domain.Entities.Deadlines;

public class Deadline : BaseEntity
{
    public int ClientId { get; set; }
    public int? CaseId { get; set; }
    public string Type { get; set; } = string.Empty; // "VAT", "IncomeTax", "Quarterly", etc.
    public DateTime HardDeadline { get; set; } // Legal government deadline
    public DateTime SoftDeadline { get; set; } // Internal team goal (e.g., 5 days before)
    public bool IsRecurring { get; set; }
    public string? RecurrencePattern { get; set; } // "Monthly", "Quarterly", "Yearly"
    public DeadlineStatus Status { get; set; } = DeadlineStatus.Pending;
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Clients.Client Client { get; set; } = null!;
    public virtual Clients.Case? Case { get; set; }
}
