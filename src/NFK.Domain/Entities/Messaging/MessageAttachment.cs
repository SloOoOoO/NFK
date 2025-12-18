using NFK.Domain.Common;

namespace NFK.Domain.Entities.Messaging;

public class MessageAttachment : BaseEntity
{
    public int MessageId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FileType { get; set; } = string.Empty;

    // Navigation properties
    public virtual Message Message { get; set; } = null!;
}
