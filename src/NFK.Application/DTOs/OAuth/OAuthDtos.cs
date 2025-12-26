namespace NFK.Application.DTOs.OAuth;

public record OAuthLoginRequest(
    string Code,
    string? RedirectUri,
    string? State
);

public record OAuthLoginResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    string TokenType,
    OAuthUserInfo User
);

public record OAuthUserInfo(
    int Id,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    string Provider
);

public record GoogleUserProfile(
    string Sub,
    string Email,
    bool EmailVerified,
    string Name,
    string GivenName,
    string FamilyName,
    string Picture
);

public record DATEVUserProfile(
    string Sub,
    string Email,
    bool EmailVerified,
    string Name,
    string GivenName,
    string FamilyName,
    string? CompanyId,
    string? ConsultantNumber
);
