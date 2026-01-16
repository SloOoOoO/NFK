using NFK.Domain.Common;

namespace NFK.Domain.Entities.Messaging;

public class Message : BaseEntity
{
    public int? SenderUserId { get; set; }
    public int RecipientUserId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public int? CaseId { get; set; }

    // Navigation properties
    public virtual Users.User? SenderUser { get; set; }
    public virtual Users.User RecipientUser { get; set; } = null!;
    public virtual Clients.Case? Case { get; set; }
    public virtual ICollection<MessageAttachment> Attachments { get; set; } = new List<MessageAttachment>();
}
