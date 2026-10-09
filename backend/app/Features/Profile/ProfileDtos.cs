using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Profile;

public sealed record ProfileContentDto(int Videos, int LearnedByOthers);

public sealed record ProfileDto(
    Guid Id, string Phone, string DisplayName, string About, string? AvatarUrl,
    int CreditBalance, string InviteCode, DateTime CreatedAtUtc, ProfileContentDto Content);

public static class AvatarUrls
{
    /// <summary>?v= avatar değişince değişir, tarayıcı önbelleği yeni görseli çeker.</summary>
    public static string? For(Guid userId, DateTime? updatedAtUtc)
        => updatedAtUtc is { } t ? $"/api/v1/users/{userId}/avatar?v={t.Ticks}" : null;
}

public static class ProfileQueries
{
    public static async Task<ProfileDto?> BuildAsync(AppDbContext db, Guid userId, CancellationToken ct)
    {
        var u = await db.Users.AsNoTracking().Where(x => x.Id == userId)
            .Select(x => new { x.Id, x.Phone, x.DisplayName, x.About, x.AvatarUpdatedAtUtc, x.CreditBalance, x.InviteCode, x.CreatedAtUtc })
            .FirstOrDefaultAsync(ct);
        if (u is null) return null;

        var videos = await db.Videos.CountAsync(v => v.CreatorId == userId && v.Status == VideoStatus.Published, ct);

        // Üreticinin puanı: videolarına BAŞKALARININ verdiği "öğrendim" toplamı
        var learned = await db.VideoMarks.CountAsync(m =>
            m.Kind == VideoMarkKind.Learned && db.Videos.Any(v => v.Id == m.VideoId && v.CreatorId == userId), ct);

        return new ProfileDto(u.Id, u.Phone, u.DisplayName, u.About, AvatarUrls.For(u.Id, u.AvatarUpdatedAtUtc),
            u.CreditBalance, u.InviteCode, u.CreatedAtUtc, new ProfileContentDto(videos, learned));
    }
}