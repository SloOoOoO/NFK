using NFK.Domain.Common;

namespace NFK.Domain.Entities.Documents;

public class DocumentVersion : BaseEntity
{
    public int DocumentId { get; set; }
    public int VersionNumber { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? ChangeNote { get; set; }

    // Navigation properties
    public virtual Document Document { get; set; } = null!;
}
