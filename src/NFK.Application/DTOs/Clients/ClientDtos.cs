namespace NFK.Application.DTOs.Clients;

public record AssignedAdvisorDto(
    int Id,
    string Name,
    string? Avatar
);

public record OpenCaseDto(
    int Id,
    string Title,
    string Status,
    DateTime? DueDate,
    int Priority
);

public record ClientDto(
    int Id,
    string Name,
    string Email,
    string Contact,
    string Status,
    string? Phone,
    string? MandantNr,
    string? LastContact,
    string? Address,
    string? City,
    string? PostalCode,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string HealthStatus,
    string? EntityType,
    AssignedAdvisorDto? AssignedAdvisor,
    List<OpenCaseDto>? OpenCases,
    string? Notes
);

public record CreateClientRequest(
    string Name,
    string Email,
    string Contact,
    string? Phone
);

public record UpdateClientRequest(
    string Name,
    string Email,
    string Contact,
    string? Phone,
    string? Status,
    string? Address,
    string? City,
    string? PostalCode
);

public record UpdateClientNotesRequest(
    string Notes
);
