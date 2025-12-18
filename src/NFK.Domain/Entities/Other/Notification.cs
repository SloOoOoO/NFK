using NFK.Domain.Common;

namespace NFK.Domain.Entities.Other;

public class Notification : BaseEntity
{
    public int UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public string? ActionUrl { get; set; }
    public string? Data { get; set; }

    // Navigation properties
    public virtual Users.User User { get; set; } = null!;
}
