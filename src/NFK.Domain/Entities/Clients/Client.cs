using NFK.Domain.Common;

namespace NFK.Domain.Entities.Clients;

public class Client : BaseEntity
{
    public int UserId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? TaxNumber { get; set; }
    public string? VatNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; } = "Germany";
    public string? PhoneNumber { get; set; }
    public string? Website { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Users.User User { get; set; } = null!;
    public virtual ICollection<Case> Cases { get; set; } = new List<Case>();
}
