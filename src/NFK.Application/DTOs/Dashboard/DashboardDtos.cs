namespace NFK.Application.DTOs.Dashboard;

public record DashboardBriefingDto(
    int UrgentDeadlines,
    int NewDocuments,
    int UnreadMessages
);

public record DashboardPerformanceDto(
    int CasesClosedThisMonth,
    int CasesClosedLastMonth,
    string Trend,
    decimal PercentageChange
);

public record DeadlineDto(
    int Id,
    string ClientName,
    string Type,
    DateTime DueDate,
    string Status,
    int? ClientsCount
);

public record ActivityDto(
    int Id,
    string Type,
    string Description,
    DateTime Timestamp,
    string Actor
);
