namespace NFK.Application.DTOs.DATEV;

public record DATEVJobDto(
    int Id,
    string JobName,
    string Status,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    string? Summary
);
