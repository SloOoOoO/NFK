using System.ComponentModel.DataAnnotations;

namespace NFK.Application.DTOs.Auth;

public record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    // Extended mandatory fields
    string? FullLegalName = null,
    string? PhoneNumber = null,
    DateTime? DateOfBirth = null,
    string? Address = null,
    string? Street = null, // Frontend compatibility: Use Street if Address not provided (temporary)
    string? City = null,
    string? PostalCode = null,
    string? Country = null,
    string? TaxId = null, // Steuer-ID (11-digit personal tax identifier)
    string? TaxNumber = null, // Steuernummer (business tax number)
    string? VatId = null, // USt-IdNr (VAT ID)
    string? CommercialRegister = null, // Handelsregister
    // Client type and company fields
    string? ClientType = null, // Privatperson, Einzelunternehmen, GmbH, etc.
    string? CompanyName = null,
    string? Salutation = null, // Herr, Frau, Divers
    string? Gender = null, // male, female, diverse
    // Optional firm fields
    string? FirmLegalName = null,
    string? FirmTaxId = null,
    string? FirmChamberRegistration = null,
    string? FirmAddress = null,
    string? FirmCity = null,
    string? FirmPostalCode = null,
    string? FirmCountry = null,
    // OAuth fields
    string? GoogleId = null,
    string? DATEVId = null
);

public record RegisterResponse(
    string Message,
    int UserId
);

public record LoginRequest(
    string Email,
    string Password
);

public record LoginResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    string TokenType,
    UserInfo User
);

public record RefreshResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    string TokenType
);

public record UserInfo(
    int Id,
    string Email,
    string FirstName,
    string LastName,
    string Role
);

public record UserResponse(
    int Id,
    string Email,
    string FirstName,
    string LastName,
    string? PhoneNumber,
    string Role,
    bool IsActive,
    string? FullLegalName = null,
    DateTime? DateOfBirth = null,
    string? Address = null,
    string? City = null,
    string? PostalCode = null,
    string? Country = null,
    string? TaxId = null, // Steuer-ID (11-digit personal tax identifier)
    string? TaxNumber = null, // Steuernummer (business tax number)
    string? VatId = null, // USt-IdNr (VAT ID)
    string? CommercialRegister = null, // Handelsregister
    string? ClientType = null, // Privatperson, Einzelunternehmen, GmbH, etc.
    string? CompanyName = null,
    string? Salutation = null, // Herr, Frau, Divers
    string? Gender = null,
    string? FirmLegalName = null,
    string? FirmTaxId = null,
    string? FirmChamberRegistration = null
);

public record ForgotPasswordRequest(
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    string Email
);

public record ResetPasswordRequest(
    [Required(ErrorMessage = "Token is required")]
    [MinLength(1, ErrorMessage = "Token is required")]
    string Token,
    
    [Required(ErrorMessage = "New password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    string NewPassword
);
