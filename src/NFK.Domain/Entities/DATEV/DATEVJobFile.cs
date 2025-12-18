using NFK.Domain.Common;

namespace NFK.Domain.Entities.DATEV;

public class DATEVJobFile : BaseEntity
{
    public int DATEVJobId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string Status { get; set; } = "Pending";

    // Navigation properties
    public virtual DATEVJob DATEVJob { get; set; } = null!;
}
