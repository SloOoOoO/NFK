using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.IdentityModel.Tokens;

namespace NFK.Infrastructure.Security;

public class JwtService
{
    private readonly string _issuer;
    private readonly string _audience;
    private readonly RSA _privateKey;
    private readonly RSA _publicKey;
    private readonly int _accessTokenExpiration = 15; // minutes
    private readonly int _refreshTokenExpiration = 7; // days

    public JwtService(string issuer, string audience, string privateKeyPem, string publicKeyPem)
    {
        _issuer = issuer;
        _audience = audience;
        _privateKey = RSA.Create();
        _privateKey.ImportFromPem(privateKeyPem);
        _publicKey = RSA.Create();
        _publicKey.ImportFromPem(publicKeyPem);
    }

    public string GenerateAccessToken(int userId, string email, IEnumerable<string> roles)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var credentials = new SigningCredentials(
            new RsaSecurityKey(_privateKey),
            SecurityAlgorithms.RsaSha256);

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_accessTokenExpiration),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _issuer,
                ValidAudience = _audience,
                IssuerSigningKey = new RsaSecurityKey(_publicKey),
                ClockSkew = TimeSpan.Zero
            };

            return tokenHandler.ValidateToken(token, validationParameters, out _);
        }
        catch
        {
            return null;
        }
    }
}
