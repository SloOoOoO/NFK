using NFK.Domain.Common;
using NFK.Domain.Enums;

namespace NFK.Domain.Entities.Clients;

public class Case : BaseEntity
{
    public int ClientId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public CaseStatus Status { get; set; } = CaseStatus.New;
    public int? AssignedToUserId { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int Priority { get; set; } = 1;
    public string? ReferenceNumber { get; set; }

    // Navigation properties
    public virtual Client Client { get; set; } = null!;
    public virtual Users.User? AssignedToUser { get; set; }
    public virtual ICollection<CaseNote> CaseNotes { get; set; } = new List<CaseNote>();
    public virtual ICollection<CaseStatusHistory> StatusHistory { get; set; } = new List<CaseStatusHistory>();
    public virtual ICollection<Documents.Document> Documents { get; set; } = new List<Documents.Document>();
}
