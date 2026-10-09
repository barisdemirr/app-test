using System.Security.Claims;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Referrals;

public sealed record InvitedUserDto(string DisplayName, DateTime JoinedAtUtc);

public sealed record ReferralResponse(
    string InviteCode, int MaxInvites, int Used, int Remaining, int InviterReward, int InviteeReward,
    IReadOnlyList<InvitedUserDto> Invited);

public sealed class GetMyReferrals : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/referrals/me", Handle).RequireAuthorization().WithTags("Referrals");

    private static async Task<IResult> Handle(
        ClaimsPrincipal principal, AppDbContext db, ReferralSettings cfg, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var me = await db.Users.AsNoTracking().Where(u => u.Id == userId)
            .Select(u => new { u.InviteCode, u.InvitesUsed }).FirstOrDefaultAsync(ct);
        if (me is null)
            return Result.Failure(Error.Unauthorized("user_not_found", "Hesap bulunamadı.")).ToProblem();

        // Telefon numarası paylaşılmaz, yalnızca görünen ad.
        var invited = await db.Users.AsNoTracking().Where(u => u.InvitedByUserId == userId)
            .OrderBy(u => u.CreatedAtUtc).Select(u => new InvitedUserDto(u.DisplayName, u.CreatedAtUtc)).ToListAsync(ct);

        return Results.Ok(new ReferralResponse(
            me.InviteCode, cfg.MaxInvitesPerUser, me.InvitesUsed, Math.Max(0, cfg.MaxInvitesPerUser - me.InvitesUsed),
            cfg.InviterReward, cfg.InviteeReward, invited));
    }
}