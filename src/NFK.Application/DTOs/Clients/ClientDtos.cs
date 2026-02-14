namespace NFK.Application.DTOs.Clients;

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
    DateTime? UpdatedAt
);

public record CreateClientRequest(
    int? UserId,
    string Name,
    string Email,
    string Contact,
    string? Phone,
    string? Address,
    string? City,
    string? PostalCode,
    string? TaxNumber
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
