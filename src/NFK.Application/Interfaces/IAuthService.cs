using NFK.Application.DTOs.Auth;

namespace NFK.Application.Interfaces;

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request);
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<RefreshResponse> RefreshTokenAsync(string refreshToken);
    Task LogoutAsync(string refreshToken);
}
