using System.Security.Claims;
using System.Text;
using Dersakis.Domain.Entities;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Dersakis.Infrastructure.Services;

public sealed class TokenService(JwtSettings settings, TimeProvider clock)
{
    private readonly SigningCredentials _credentials =
        new(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Key)), SecurityAlgorithms.HmacSha256);

    private readonly JsonWebTokenHandler _handler = new();

    public (string Token, DateTime ExpiresAtUtc) Create(User user)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var expires = now.AddMinutes(settings.AccessTokenMinutes);

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
            ]),
            Issuer = settings.Issuer,
            Audience = settings.Audience,
            IssuedAt = now,
            NotBefore = now,
            Expires = expires,
            SigningCredentials = _credentials
        };

        return (_handler.CreateToken(descriptor), expires);
    }
}