namespace NFK.Domain.Enums;

public enum UserRole
{
    SuperAdmin = 1,
    Consultant = 2,      // Also known as Steuerberater (Tax Consultant)
    Receptionist = 3,
    Client = 4,
    DATEVManager = 5,
    Admin = 6,           // General admin role
    Steuerberater = 7    // Alias for Consultant for clarity
}
