using NFK.Domain.Common;
using NFK.Domain.Enums;

namespace NFK.Domain.Entities.Documents;

public class Document : BaseEntity
{
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DocumentStatus Status { get; set; } = DocumentStatus.Draft;
    public int? CaseId { get; set; }
    public int? FolderId { get; set; }
    public int? UploadedByUserId { get; set; }
    public string? Description { get; set; }
    public string? Tags { get; set; }
    public int Version { get; set; } = 1;
    public string? ChecksumHash { get; set; }

    // Navigation properties
    public virtual Clients.Case? Case { get; set; }
    public virtual DocumentFolder? Folder { get; set; }
    public virtual Users.User? UploadedByUser { get; set; }
    public virtual ICollection<DocumentComment> Comments { get; set; } = new List<DocumentComment>();
    public virtual ICollection<DocumentVersion> Versions { get; set; } = new List<DocumentVersion>();
}
