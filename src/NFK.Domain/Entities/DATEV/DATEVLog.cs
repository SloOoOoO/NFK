using NFK.Domain.Common;

namespace NFK.Domain.Entities.DATEV;

public class DATEVLog : BaseEntity
{
    public int DATEVJobId { get; set; }
    public string Level { get; set; } = "Info"; // Info, Warning, Error
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }

    // Navigation properties
    public virtual DATEVJob DATEVJob { get; set; } = null!;
}
