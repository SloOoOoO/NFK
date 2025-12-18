using NFK.Domain.Common;

namespace NFK.Domain.Entities.Documents;

public class DocumentComment : BaseEntity
{
    public int DocumentId { get; set; }
    public int UserId { get; set; }
    public string Content { get; set; } = string.Empty;

    // Navigation properties
    public virtual Document Document { get; set; } = null!;
    public virtual Users.User User { get; set; } = null!;
}
