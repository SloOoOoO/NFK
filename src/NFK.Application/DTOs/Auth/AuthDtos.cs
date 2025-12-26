namespace NFK.Application.DTOs.Auth;

public record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName
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
