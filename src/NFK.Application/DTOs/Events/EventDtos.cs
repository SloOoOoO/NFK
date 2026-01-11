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
