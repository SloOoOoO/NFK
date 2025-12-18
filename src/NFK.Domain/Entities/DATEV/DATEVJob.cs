using NFK.Domain.Common;

namespace NFK.Domain.Entities.DATEV;

public class DATEVJob : BaseEntity
{
    public string JobName { get; set; } = string.Empty;
    public string JobType { get; set; } = string.Empty; // EXTF or dxso
    public string Status { get; set; } = "Pending"; // Pending, Processing, Completed, Failed
    public int? ClientId { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; }
    public string? OutputFilePath { get; set; }

    // Navigation properties
    public virtual Clients.Client? Client { get; set; }
    public virtual ICollection<DATEVJobFile> Files { get; set; } = new List<DATEVJobFile>();
    public virtual ICollection<DATEVLog> Logs { get; set; } = new List<DATEVLog>();
}
