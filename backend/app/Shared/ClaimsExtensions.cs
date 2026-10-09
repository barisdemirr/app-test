using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Dersakis.Shared;

public static class ClaimsExtensions
{
    public static Guid? GetUserId(this ClaimsPrincipal principal)
        => Guid.TryParse(principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var id) ? id : null;
}