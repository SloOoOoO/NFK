namespace NFK.Domain.Enums;

public enum UserRole
{
    SuperAdmin = 1,
    Consultant = 2,      // Tax Consultant (Steuerberater) - primary role
    Receptionist = 3,
    Client = 4,
    DATEVManager = 5,
    // 6 intentionally removed (was Admin, no longer used)
    RegisteredUser = 7,  // New users who registered but not yet assigned Client role
}
