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
    string? TaxNumber = null,
    string? VatId = null,
    string? ClientType = null,
    string? CompanyName = null,
    string? Salutation = null,
    string? CommercialRegister = null,
    string? Gender = null,
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

public record UserStatisticsDto(
    int TotalUsers,
    int TotalClients,
    int ActiveUsers,
    DailyActiveUsersDto DailyActive,
    WeeklyActiveUsersDto WeeklyActive,
    MonthlyActiveUsersDto MonthlyActive,
    NewSignupsDto NewSignups,
    KeyEventsDto KeyEvents,
    LoginActivityDto LoginActivity
);

public record DailyActiveUsersDto(
    int Count,
    DateTime Date
);

public record WeeklyActiveUsersDto(
    int Count,
    DateTime WeekStart
);

public record MonthlyActiveUsersDto(
    int Count,
    DateTime MonthStart
);

public record NewSignupsDto(
    int Today,
    int ThisWeek,
    int ThisMonth
);

public record KeyEventsDto(
    int LoginsToday,
    int LoginsThisWeek,
    int DocumentUploadsToday,
    int DocumentUploadsThisWeek,
    int DATEVSyncsCompletedToday,
    int DATEVSyncsCompletedThisWeek
);

public record LoginActivityDto(
    int Daily,
    int Monthly,
    int Yearly,
    List<LoginDayDto> Last30Days
);

public record LoginDayDto(
    string Date,
    int Count
);

public record AssistantAssignmentDto(
    int Id,
    int AssistantUserId,
    string AssistantName,
    int ConsultantUserId,
    string ConsultantName
);

public record AssignAssistantRequest(
    int ConsultantUserId
);
