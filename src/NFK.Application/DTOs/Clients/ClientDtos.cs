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
    string? TaxNumber,
    string? Address,
    string? City,
    string? PostalCode,
    DateTime CreatedAt,
    DateTime? UpdatedAt
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
    string? TaxNumber,
    string? Address,
    string? City,
    string? PostalCode
);
