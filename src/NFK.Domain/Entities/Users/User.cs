using NFK.Domain.Common;

namespace NFK.Domain.Entities.Users;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsEmailConfirmed { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsLocked { get; set; }
    public int FailedLoginAttempts { get; set; }
    public DateTime? LockedUntil { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string? GoogleId { get; set; }
    public string? DATEVId { get; set; }
    public string? Gender { get; set; } // "male", "female", "diverse"

    // Extended registration fields
    public string? FullLegalName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? TaxId { get; set; } // Steuer-ID (11-digit personal tax identifier)
    public string? TaxNumber { get; set; } // Steuernummer (business tax number)
    public bool PhoneVerified { get; set; }
    
    // Optional firm details
    public string? FirmLegalName { get; set; }
    public string? FirmTaxId { get; set; }
    public string? FirmChamberRegistration { get; set; }
    public string? FirmAddress { get; set; }
    public string? FirmCity { get; set; }
    public string? FirmPostalCode { get; set; }
    public string? FirmCountry { get; set; }
    
    // Security enhancements
    public DateTime? PasswordChangedAt { get; set; }
    public DateTime? PasswordExpiresAt { get; set; }

    // Navigation properties
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public virtual ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>();
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public virtual ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();
    public virtual ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();
    public virtual ICollection<PasswordHistory> PasswordHistories { get; set; } = new List<PasswordHistory>();
}
