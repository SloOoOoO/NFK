namespace NFK.Application.DTOs.Admin;

public record UserListDto(
    int Id,
    string Email,
    string FullName,
    string Role,
    bool IsActive,
    DateTime CreatedAt
);

public record UpdateUserRoleRequest(
    string Role
);

public record UpdateUserProfileRequest(
    string? FirstName = null,
    string? LastName = null,
    string? Email = null,
    string? PhoneNumber = null,
    string? FullLegalName = null,
    DateTime? DateOfBirth = null,
    string? TaxId = null,
    string? Address = null,
    string? City = null,
    string? PostalCode = null,
    string? Country = null
);

public record HeaderTextDto(
    string WelcomeTitle,
    string WelcomeSubtitle
);

public record UpdateHeaderTextRequest(
    string WelcomeTitle,
    string WelcomeSubtitle
);
