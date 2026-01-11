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

public record HeaderTextDto(
    string WelcomeTitle,
    string WelcomeSubtitle
);

public record UpdateHeaderTextRequest(
    string WelcomeTitle,
    string WelcomeSubtitle
);
