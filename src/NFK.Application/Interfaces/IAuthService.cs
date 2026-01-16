using NFK.Application.DTOs.Auth;

namespace NFK.Application.Interfaces;

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request);
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<RefreshResponse> RefreshTokenAsync(string refreshToken);
    Task LogoutAsync(string refreshToken);
    Task<UserResponse> GetUserByIdAsync(int userId);
    Task<string> RequestPasswordResetAsync(string email);
    Task ResetPasswordAsync(string token, string newPassword);
}
