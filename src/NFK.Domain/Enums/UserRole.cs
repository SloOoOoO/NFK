namespace NFK.Domain.Enums;

public enum UserRole
{
    SuperAdmin = 1,
    Consultant = 2,      // Tax Consultant (Steuerberater) - primary role
    Receptionist = 3,
    Client = 4,
    DATEVManager = 5,
    Admin = 6,           // General admin role
    Steuerberater = 2    // Alias for Consultant - maps to same value for compatibility
}
