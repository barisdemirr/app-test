using System.Security.Claims;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Quiz;

public sealed record QuestionOptionDto(Guid Id, string Text);
public sealed record QuestionResultDto(Guid SelectedOptionId, Guid CorrectOptionId, bool IsCorrect, string Explanation, int CreditAwarded);
public sealed record QuestionDto(Guid Id, int Position, string Text, IReadOnlyList<QuestionOptionDto> Options, QuestionResultDto? Result);
public sealed record QuestionsResponse(Guid VideoId, IReadOnlyList<QuestionDto> Questions);

public sealed class GetQuestions : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/videos/{videoId:guid}/questions", Handle).RequireAuthorization().WithTags("Quiz");

    private static async Task<IResult> Handle(
        Guid videoId, HttpContext http, AppDbContext db, CancellationToken ct)
    {
        if (http.User.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var creatorId = await db.Videos.AsNoTracking()
            .Where(v => v.Id == videoId && v.Status == VideoStatus.Published)
            .Select(v => (Guid?)v.CreatorId).FirstOrDefaultAsync(ct);
        if (creatorId is null)
            return Result.Failure(Error.NotFound("video_not_found", "Video bulunamadı.")).ToProblem();
        if (creatorId == userId)
            return Result.Failure(Error.Forbidden("own_video", "Kendi videonun sorularından kredi kazanamazsın.")).ToProblem();

        var watched = await db.WatchSessions.AsNoTracking()
            .AnyAsync(w => w.UserId == userId && w.VideoId == videoId && w.Status == WatchStatus.Completed, ct);
        if (!watched)
            return Result.Failure(Error.Forbidden("watch_required", "Soruları görmek için videoyu sonuna kadar izlemelisin.")).ToProblem();

        // IsCorrect bellekte sadece cevaplanmış sorular için sonuç üretmekte kullanılır, DTO'ya hiç konmaz.
        var questions = await db.VideoQuestions.AsNoTracking()
            .Where(q => q.VideoId == videoId)
            .OrderBy(q => q.Position)
            .Select(q => new
            {
                q.Id,
                q.Position,
                q.Text,
                q.Explanation,
                Options = q.Options.Select(o => new { o.Id, o.Text, o.IsCorrect }).ToList()
            })
            .ToListAsync(ct);

        var attempts = (await db.QuizAttempts.AsNoTracking()
                .Where(a => a.UserId == userId && a.VideoId == videoId).ToListAsync(ct))
            .ToDictionary(a => a.QuestionId);

        var result = questions.Select(q =>
        {
            var options = q.Options.Select(o => new QuestionOptionDto(o.Id, o.Text)).ToArray();
            Random.Shared.Shuffle(options); // her istekte yeni sıra: şık konumundan doğru cevap çıkarılamaz

            QuestionResultDto? res = attempts.TryGetValue(q.Id, out var a)
                ? new QuestionResultDto(a.SelectedOptionId, q.Options.First(o => o.IsCorrect).Id, a.IsCorrect, q.Explanation, a.CreditAwarded)
                : null;

            return new QuestionDto(q.Id, q.Position, q.Text, options, res);
        }).ToList();

        http.Response.Headers.CacheControl = "no-store";
        return Results.Ok(new QuestionsResponse(videoId, result));
    }
}