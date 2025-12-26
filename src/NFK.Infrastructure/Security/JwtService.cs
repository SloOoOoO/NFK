using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace NFK.Infrastructure.Security;

public class JwtService
{
    private readonly string _issuer;
    private readonly string _audience;
    private readonly RSA? _privateKey;
    private readonly RSA? _publicKey;
    private readonly SymmetricSecurityKey? _symmetricKey;
    private readonly int _accessTokenExpiration;
    private readonly int _refreshTokenExpiration;
    private readonly bool _useSymmetricKey;

    // Constructor for symmetric key (HMAC-SHA256)
    public JwtService(string issuer, string audience, string secret, int accessTokenExpirationMinutes = 15, int refreshTokenExpirationDays = 7)
    {
        _issuer = issuer;
        _audience = audience;
        _symmetricKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        _accessTokenExpiration = accessTokenExpirationMinutes;
        _refreshTokenExpiration = refreshTokenExpirationDays;
        _useSymmetricKey = true;
    }

    // Constructor for asymmetric key (RSA)
    public JwtService(string issuer, string audience, string privateKeyPem, string publicKeyPem, int accessTokenExpirationMinutes = 15, int refreshTokenExpirationDays = 7)
    {
        _issuer = issuer;
        _audience = audience;
        _privateKey = RSA.Create();
        _privateKey.ImportFromPem(privateKeyPem);
        _publicKey = RSA.Create();
        _publicKey.ImportFromPem(publicKeyPem);
        _accessTokenExpiration = accessTokenExpirationMinutes;
        _refreshTokenExpiration = refreshTokenExpirationDays;
        _useSymmetricKey = false;
    }

    public string GenerateAccessToken(int userId, string email, string firstName, string lastName, IEnumerable<string> roles)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim("firstName", firstName),
            new Claim("lastName", lastName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        claims.AddRange(roles.Select(role => new Claim("role", role)));

        SigningCredentials credentials;
        if (_useSymmetricKey)
        {
            credentials = new SigningCredentials(_symmetricKey, SecurityAlgorithms.HmacSha256);
        }
        else
        {
            credentials = new SigningCredentials(
                new RsaSecurityKey(_privateKey!),
                SecurityAlgorithms.RsaSha256);
        }

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
            
            TokenValidationParameters validationParameters;
            if (_useSymmetricKey)
            {
                validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _issuer,
                    ValidAudience = _audience,
                    IssuerSigningKey = _symmetricKey,
                    ClockSkew = TimeSpan.Zero
                };
            }
            else
            {
                validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _issuer,
                    ValidAudience = _audience,
                    IssuerSigningKey = new RsaSecurityKey(_publicKey!),
                    ClockSkew = TimeSpan.Zero
                };
            }

            return tokenHandler.ValidateToken(token, validationParameters, out _);
        }
        catch
        {
            return null;
        }
    }

    public int GetAccessTokenExpirationSeconds()
    {
        return _accessTokenExpiration * 60;
    }

    public int GetRefreshTokenExpirationDays()
    {
        return _refreshTokenExpiration;
    }
}
