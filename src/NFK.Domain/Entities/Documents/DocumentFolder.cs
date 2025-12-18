using NFK.Domain.Common;

namespace NFK.Domain.Entities.Documents;

public class DocumentFolder : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int? ParentFolderId { get; set; }
    public int? ClientId { get; set; }
    public string? Description { get; set; }

    // Navigation properties
    public virtual DocumentFolder? ParentFolder { get; set; }
    public virtual Clients.Client? Client { get; set; }
    public virtual ICollection<DocumentFolder> SubFolders { get; set; } = new List<DocumentFolder>();
    public virtual ICollection<Document> Documents { get; set; } = new List<Document>();
}
