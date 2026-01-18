namespace NFK.Application.DTOs.Events;

public record EventDto(
    int Id,
    string Title,
    string Mandant,
    DateTime Date,
    string Time,
    string Type,
    string? Notes
);

public record CreateEventDto(
    int ClientId,
    string Title,
    string? Description,
    DateTime Date,
    string Time,
    string? Location
);

public record UpdateEventDto(
    string Title,
    string? Description,
    DateTime? Date,
    string? Time,
    string? Location,
    string? Status
);
