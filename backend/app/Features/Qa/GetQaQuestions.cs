using System.Security.Claims;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Qa;

public sealed record QaQuestionsResponse(IReadOnlyList<QaQuestionDto> Items, long? NextCursor);

public sealed class GetQaQuestions : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/qa/questions", Handle).RequireAuthorization().WithTags("QA");

    private static async Task<IResult> Handle(
        ClaimsPrincipal principal, AppDbContext db, QaSettings cfg,
        [FromQuery] string[]? categories, string? mode, string? status, string? search,
        long? cursor, int? limit, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        if (categories is { Length: > 10 })
            return Bad("En fazla 10 kategori filtrelenebilir.");

        var term = (search ?? "").Trim();
        if (term.Length > 50) return Bad("Arama en fazla 50 karakter olabilir.");

        QaMode? modeFilter = null;
        if (!string.IsNullOrWhiteSpace(mode))
        {
            if (!mode.Trim().All(char.IsLetter) || !Enum.TryParse<QaMode>(mode.Trim(), true, out var m) || !Enum.IsDefined(m))
                return Bad("mode 'Text' veya 'Voice' olmalı.");
            modeFilter = m;
        }

        var st = (status ?? "all").Trim().ToLowerInvariant();
        if (st is not ("all" or "open" or "solved")) return Bad("status 'all', 'open' veya 'solved' olmalı.");

        var size = Math.Clamp(limit ?? 10, 1, 30);

        var query =
            from q in db.QaQuestions.AsNoTracking()
            join u in db.Users on q.AuthorId equals u.Id
            select new { q, AuthorName = u.DisplayName };

        if (categories is { Length: > 0 }) query = query.Where(x => categories.Contains(x.q.Category));
        if (modeFilter is { } mf) query = query.Where(x => x.q.Mode == mf);
        if (st == "open") query = query.Where(x => x.q.BestAnswerId == null);
        if (st == "solved") query = query.Where(x => x.q.BestAnswerId != null);
        if (cursor is { } after) query = query.Where(x => x.q.Seq < after);
        if (term.Length > 0)
        {
            // Joker karakterler kaçırılır: kullanıcı "%" ile pahalı sorgu üretemez.
            var p = "%" + term.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_").Replace("[", "\\[") + "%";
            query = query.Where(x =>
                EF.Functions.Like(x.q.Text, p, "\\") || EF.Functions.Like(x.q.Topic, p, "\\") ||
                EF.Functions.Like(x.q.Category, p, "\\") || EF.Functions.Like(x.AuthorName, p, "\\"));
        }

        // size + 1 satır: fazlalık "sonraki sayfa var" demek (COUNT sorgusu yok)
        var rows = await query.OrderByDescending(x => x.q.Seq).Take(size + 1).ToListAsync(ct);
        var page = rows.Take(size).ToList();

        return Results.Ok(new QaQuestionsResponse(
            page.Select(x => QaMapping.ToDto(x.q, x.AuthorName, userId, cfg)).ToList(),
            rows.Count > size ? page[^1].q.Seq : null));
    }

    private static IResult Bad(string message) => Result.Failure(Error.Validation("validation_failed", message)).ToProblem();
}