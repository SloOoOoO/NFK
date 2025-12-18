using NFK.Domain.Common;

namespace NFK.Domain.Entities.Other;

public class Appointment : BaseEntity
{
    public int ClientId { get; set; }
    public int? ConsultantUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Location { get; set; }
    public string Status { get; set; } = "Scheduled"; // Scheduled, Confirmed, Cancelled, Completed
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Clients.Client Client { get; set; } = null!;
    public virtual Users.User? ConsultantUser { get; set; }
}
