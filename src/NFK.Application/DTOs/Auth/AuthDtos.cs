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
    string? City = null,
    string? PostalCode = null,
    string? Country = null,
    string? TaxId = null,
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
    string? TaxId = null,
    string? FirmLegalName = null,
    string? FirmTaxId = null,
    string? FirmChamberRegistration = null
);

public record ForgotPasswordRequest(
    string Email
);

public record ResetPasswordRequest(
    string Token,
    string NewPassword
);
