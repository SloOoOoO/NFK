namespace NFK.Application.DTOs.Deadlines;

public record CalendarDayDto(
    string Date,
    string Load,
    List<CalendarDeadlineDto> Deadlines
);

public record CalendarDeadlineDto(
    int Id,
    string ClientName,
    string Type,
    DateTime HardDeadline,
    DateTime SoftDeadline,
    string Status
);

public record CreateDeadlineRequest(
    int ClientId,
    string Type,
    DateTime HardDeadline,
    DateTime SoftDeadline,
    bool IsRecurring,
    string? RecurrencePattern
);
