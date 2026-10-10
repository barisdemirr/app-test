using System.Text.Encodings.Web;
using System.Text.Json;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Ai;

/// <summary>Modele verilecek bağlam (JSON) ve istemciye gösterilecek yanlış cevap listesi. Hepsi SUNUCUDA, JWT'deki kullanıcıdan üretilir.</summary>
public sealed record StudyContext(string Json, IReadOnlyList<AiWrongAnswerDto> Wrong);

public static class AiStudyContext
{
    private static readonly JsonSerializerOptions Json = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        WriteIndented = false
    };

    public static async Task<StudyContext> BuildAsync(
        AppDbContext db, Guid userId, AiSettings cfg, DateOnly today, CancellationToken ct)
    {
        var name = await db.Users.AsNoTracking().Where(u => u.Id == userId).Select(u => u.DisplayName).FirstOrDefaultAsync(ct) ?? "";
        var first = AiGuard.CleanData(name.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault(), 20);

        // 1) Ders/konu bazlı başarı (GetStats ile aynı gruplama, SQL'de)
        var rows = await (
            from a in db.QuizAttempts.AsNoTracking()
            where a.UserId == userId
            join v in db.Videos on a.VideoId equals v.Id
            join c in db.Courses on v.CourseId equals c.Id
            group a by new { CourseName = c.Name, v.Topic } into g
            select new { g.Key.CourseName, g.Key.Topic, Answered = g.Count(), Correct = g.Count(x => x.IsCorrect) })
            .ToListAsync(ct);

        var courses = rows
            .GroupBy(r => r.CourseName)
            .Select(g =>
            {
                var answered = g.Sum(r => r.Answered);
                var correct = g.Sum(r => r.Correct);
                return new
                {
                    ders = AiGuard.CleanData(g.Key, 60),
                    cevap = answered,
                    dogru = correct,
                    yuzde = Pct(correct, answered),
                    // en zayıf konular önce
                    konular = g.OrderBy(r => Pct(r.Correct, r.Answered)).ThenByDescending(r => r.Answered).Take(6)
                        .Select(r => new { konu = AiGuard.CleanData(r.Topic, 60), cevap = r.Answered, dogru = r.Correct, yuzde = Pct(r.Correct, r.Answered) })
                        .ToList()
                };
            })
            .OrderBy(c => c.yuzde)
            .Take(8)
            .ToList();

        var totalAnswered = rows.Sum(r => r.Answered);
        var totalCorrect = rows.Sum(r => r.Correct);

        // 2) Son yanlışlar: soru, seçilen şık, doğru şık, açıklama
        var wrongRows = await (
            from a in db.QuizAttempts.AsNoTracking()
            where a.UserId == userId && !a.IsCorrect
            join q in db.VideoQuestions on a.QuestionId equals q.Id
            join v in db.Videos on a.VideoId equals v.Id
            join c in db.Courses on v.CourseId equals c.Id
            orderby a.CreatedAtUtc descending
            select new
            {
                a.QuestionId,
                a.SelectedOptionId,
                a.CreatedAtUtc,
                Question = q.Text,
                q.Explanation,
                v.Topic,
                VideoTitle = v.Title,
                Course = c.Name
            })
            .Take(Math.Max(cfg.ContextWrongAnswers, 0))
            .ToListAsync(ct);

        var qIds = wrongRows.Select(w => w.QuestionId).Distinct().ToList();
        var options = await db.VideoOptions.AsNoTracking()
            .Where(o => qIds.Contains(o.QuestionId))
            .Select(o => new { o.Id, o.QuestionId, o.Text, o.IsCorrect })
            .ToListAsync(ct);

        var wrong = wrongRows.Select(w =>
        {
            var yours = options.FirstOrDefault(o => o.Id == w.SelectedOptionId)?.Text ?? "";
            var correct = options.FirstOrDefault(o => o.QuestionId == w.QuestionId && o.IsCorrect)?.Text ?? "";
            return new AiWrongAnswerDto(
                w.QuestionId,
                AiGuard.CleanData(w.Course, 60), AiGuard.CleanData(w.Topic, 60), AiGuard.CleanData(w.VideoTitle, 100),
                AiGuard.CleanData(w.Question, 300), AiGuard.CleanData(yours, 150), AiGuard.CleanData(correct, 150),
                AiGuard.CleanData(w.Explanation, 300), w.CreatedAtUtc);
        }).ToList();

        var tr = System.Globalization.CultureInfo.GetCultureInfo("tr-TR");
        var data = new
        {
            ad = first,
            bugun = today.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture) + " " + today.ToString("dddd", tr),
            toplamCevap = totalAnswered,
            toplamDogru = totalCorrect,
            basariYuzde = Pct(totalCorrect, totalAnswered),
            dersler = courses,
            sonYanlislar = wrong.Select(w => new
            {
                ders = w.Course, konu = w.Topic, video = w.VideoTitle, soru = w.Question,
                senCevabin = w.YourAnswer, dogruCevap = w.CorrectAnswer, aciklama = w.Explanation
            })
        };

        return new StudyContext(JsonSerializer.Serialize(data, Json), wrong);
    }

    private static int Pct(int correct, int answered)
        => answered == 0 ? 0 : (int)Math.Round(correct * 100.0 / answered, MidpointRounding.AwayFromZero);
}
