namespace NFK.Application.DTOs.Cases;

public record CaseDto(
    int Id,
    string Title,
    string Subject,
    int ClientId,
    string ClientName,
    string Status,
    string Priority,
    DateTime? DueDate,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record CreateCaseRequest(
    string Title,
    string Description,
    int ClientId,
    string? Priority,
    DateTime? DueDate
);

public record UpdateCaseRequest(
    string Title,
    string? Description,
    string? Status,
    string? Priority,
    DateTime? DueDate
);

public record UpdateCaseStatusRequest(
    string Status
);
