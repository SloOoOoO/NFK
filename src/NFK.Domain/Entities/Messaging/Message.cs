using NFK.Domain.Common;

namespace NFK.Domain.Entities.Messaging;

public class Message : BaseEntity
{
    /// <summary>
    /// Sender user ID. Null for external messages (e.g., emails from external sources).
    /// For internal messages, this must reference a valid user.
    /// </summary>
    public int? SenderUserId { get; set; }
    
    /// <summary>
    /// Recipient user ID. Always required as messages are always delivered to internal users.
    /// </summary>
    public int RecipientUserId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public int? CaseId { get; set; }
    
    /// <summary>
    /// Indicates if this message originated from a pool email (e.g., info@nfk-buchhaltung.de).
    /// Pool emails are visible to all employee roles but not to clients.
    /// </summary>
    public bool IsPoolEmail { get; set; }
    
    /// <summary>
    /// Comma-separated list of role names that can see this message.
    /// Used primarily for pool emails to restrict visibility to employee roles.
    /// </summary>
    public string? RecipientRoles { get; set; }

    // Navigation properties
    public virtual Users.User? SenderUser { get; set; }
    public virtual Users.User RecipientUser { get; set; } = null!;
    public virtual Clients.Case? Case { get; set; }
    public virtual ICollection<MessageAttachment> Attachments { get; set; } = new List<MessageAttachment>();
}
