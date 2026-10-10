using System.Globalization;
using System.Security.Claims;
using System.Text.Json;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;

namespace Dersakis.Features.Ai;

/// <summary>
/// POST /ai/chat: Dolphy (çalışma koçu). Gemini anahtarı yalnızca sunucuda durur; bağlam (istatistik, yanlışlar)
/// istemciden alınmaz, JWT'deki kullanıcıdan veritabanından üretilir. Model araç/internet erişimine sahip değildir,
/// yalnızca şemalı JSON döner ve her alan doğrulanarak istemciye verilir.
/// </summary>
public sealed class AiChat : IEndpoint
{
    private const string Refusal = "Bunu paylaşamam, ama çalışma planı hazırlamakta ya da yanlış yaptığın sorulara bakmakta sana yardım edebilirim 🐬";
    private const string BlockedReply = "Bu konuda yardımcı olamıyorum, ama ders çalışmanda seninleyim 🐬";
    private const string ConfusedReply = "Bunu tam toparlayamadım. İsteğini biraz daha açık yazar mısın? 🐬";

    private static readonly string[] DefaultSuggestions = ["Çalışma planı hazırla", "Yanlışlarımı göster", "Benzer soru ver"];

    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/ai/chat", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Ai)
              .WithTags("AI");

    private static async Task<IResult> Handle(
        AiChatRequest req, HttpContext http, AppDbContext db, GeminiClient gemini, AiSettings cfg,
        AiUsageLimiter usage, TimeProvider clock, ILogger<AiChat> log, CancellationToken ct)
    {
        if (http.User.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        if (!cfg.Enabled)
            return Results.Problem(statusCode: 503, title: "ai_unavailable", detail: "Dolphy şu an dinleniyor. Biraz sonra tekrar dene.");

        // ---- 1) Girdi doğrulama: roller, uzunluk, görünmez karakterler ----
        var raw = req.Messages ?? [];
        if (raw.Count is 0 or > 40) return Bad("Mesaj listesi geçersiz.");

        var turns = new List<GeminiTurn>();
        foreach (var m in raw.TakeLast(cfg.MaxHistoryTurns))
        {
            var role = (m.Role ?? "").Trim().ToLowerInvariant();
            if (role is not ("user" or "model")) return Bad("Geçersiz mesaj rolü.");

            string? text = role == "user"
                ? AiGuard.CleanUserText(m.Text, cfg.MaxMessageChars)
                : AiGuard.CleanOutput(m.Text, cfg.MaxMessageChars * 4); // geçmişteki "model" metni de güvenilmez sayılır
            if (string.IsNullOrWhiteSpace(text))
                return Bad($"Mesaj boş ya da çok uzun (en fazla {cfg.MaxMessageChars} karakter).");

            // Gemini art arda aynı rolü sevmez: birleştir.
            if (turns.Count > 0 && turns[^1].Role == role)
                turns[^1] = turns[^1] with { Text = turns[^1].Text + "\n" + text };
            else
                turns.Add(new GeminiTurn(role, text));
        }
        while (turns.Count > 0 && turns[0].Role != "user") turns.RemoveAt(0);
        if (turns.Count == 0 || turns[^1].Role != "user") return Bad("Son mesaj kullanıcıdan olmalı.");

        var last = turns[^1].Text;
        if (AiGuard.LooksLikeInjection(last))
            log.LogWarning("AI: olası prompt enjeksiyonu denemesi user={User} örnek={Sample}", userId, last.Length > 80 ? last[..80] : last);

        // ---- 2) Günlük hak (dakikalık sınır ayrıca rate limit politikasında) ----
        if (!usage.TryConsume(userId, cfg.DailyMessageLimit, out var remaining))
            return Results.Problem(statusCode: 429, title: "ai_daily_limit",
                detail: "Bugünlük Dolphy hakkın doldu, yarın yine buradayım! 🐬");

        try
        {
            // ---- 3) Bağlam: sunucuda, bu kullanıcının verisinden ----
            var ctx = await AiStudyContext.BuildAsync(db, userId, cfg, TurkeyClock.Today(clock), ct);

            // ---- 4) Model ----
            var result = await gemini.GenerateAsync(AiPrompts.System(ctx.Json), turns, ct);

            if (result.Failure == "blocked")
                return Respond(new AiChatResponse(BlockedReply, null, [], [], DefaultSuggestions, remaining));

            if (result.Text is null)
            {
                usage.Refund(userId);
                return Results.Problem(statusCode: 503, title: "ai_unavailable", detail: "Dolphy şu an dinleniyor. Biraz sonra tekrar dene.");
            }

            // ---- 5) Çıktı doğrulama ----
            var parsed = Parse(result.Text);
            if (parsed is null)
            {
                log.LogWarning("AI: model çıktısı şemaya uymadı");
                return Respond(new AiChatResponse(ConfusedReply, null, [], [], DefaultSuggestions, remaining));
            }

            if (AiGuard.Leaks(AllText(parsed)))
            {
                log.LogWarning("AI: talimat sızıntısı engellendi user={User}", userId);
                return Respond(new AiChatResponse(Refusal, null, [], [], DefaultSuggestions, remaining));
            }

            var wrong = parsed.ShowWrong ? PickWrong(ctx.Wrong, parsed.Topic) : new List<AiWrongAnswerDto>();
            var reply = parsed.Reply;
            if (reply.Length == 0)
                reply = parsed.Plan is not null || parsed.Practice.Count > 0 || wrong.Count > 0 ? "İşte hazırladıklarım 🐬" : ConfusedReply;

            return Respond(new AiChatResponse(
                reply, parsed.Plan, parsed.Practice, wrong,
                parsed.Suggestions.Count > 0 ? parsed.Suggestions : DefaultSuggestions, remaining));
        }
        catch (Exception) when (!ct.IsCancellationRequested)
        {
            usage.Refund(userId);
            throw;
        }
    }

    // ------------------------------------------------------------------ yardımcılar

    private static IResult Respond(AiChatResponse body) => new NoStoreResult(Results.Ok(body));

    private sealed class NoStoreResult(IResult inner) : IResult
    {
        public Task ExecuteAsync(HttpContext http)
        {
            http.Response.Headers.CacheControl = "no-store";
            return inner.ExecuteAsync(http);
        }
    }

    private static IResult Bad(string message)
        => Result.Failure(Error.Validation("validation_failed", message)).ToProblem();

    private static List<AiWrongAnswerDto> PickWrong(IReadOnlyList<AiWrongAnswerDto> all, string? topic)
    {
        IEnumerable<AiWrongAnswerDto> q = all;
        if (!string.IsNullOrWhiteSpace(topic))
        {
            var ci = CultureInfo.GetCultureInfo("tr-TR").CompareInfo;
            var filtered = all.Where(w =>
                ci.IndexOf(w.Topic, topic, CompareOptions.IgnoreCase) >= 0 ||
                ci.IndexOf(w.Course, topic, CompareOptions.IgnoreCase) >= 0).ToList();
            if (filtered.Count > 0) q = filtered;
        }
        return q.Take(5).ToList();
    }

    private sealed record Parsed(
        string Reply, bool ShowWrong, string? Topic, AiPlanDto? Plan,
        List<AiPracticeDto> Practice, List<string> Suggestions);

    private static string AllText(Parsed p)
    {
        var parts = new List<string> { p.Reply };
        if (p.Plan is not null)
        {
            parts.Add(p.Plan.Title);
            foreach (var d in p.Plan.Days)
            {
                parts.Add(d.Day);
                foreach (var t in d.Tasks) { parts.Add(t.Topic); parts.Add(t.What); }
            }
        }
        foreach (var x in p.Practice)
        {
            parts.Add(x.Course); parts.Add(x.Question); parts.Add(x.Explanation);
            parts.AddRange(x.Options);
        }
        parts.AddRange(p.Suggestions);
        return string.Join("\n", parts);
    }

    /// <summary>Model JSON'unu alan alan doğrular: tipler, uzunluklar, sayılar. Geçersiz parça sessizce atılır.</summary>
    private static Parsed? Parse(string json)
    {
        JsonDocument doc;
        try { doc = JsonDocument.Parse(json); }
        catch (JsonException) { return null; }

        using (doc)
        {
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object) return null;

            var reply = AiGuard.CleanOutput(Str(root, "reply"), 900);
            var showWrong = root.TryGetProperty("showWrongAnswers", out var sw) && sw.ValueKind == JsonValueKind.True;
            var topic = AiGuard.CleanOutput(Str(root, "wrongAnswersTopic"), 60);

            return new Parsed(
                reply, showWrong, topic.Length == 0 ? null : topic,
                ParsePlan(root), ParsePractice(root), ParseSuggestions(root));
        }
    }

    private static AiPlanDto? ParsePlan(JsonElement root)
    {
        if (!root.TryGetProperty("plan", out var plan) || plan.ValueKind != JsonValueKind.Object) return null;
        if (!plan.TryGetProperty("days", out var days) || days.ValueKind != JsonValueKind.Array) return null;

        var outDays = new List<AiPlanDayDto>();
        foreach (var d in days.EnumerateArray().Take(7))
        {
            if (d.ValueKind != JsonValueKind.Object) continue;
            var day = AiGuard.CleanOutput(Str(d, "day"), 40);
            if (day.Length == 0 || !d.TryGetProperty("tasks", out var tasks) || tasks.ValueKind != JsonValueKind.Array) continue;

            var outTasks = new List<AiPlanTaskDto>();
            foreach (var t in tasks.EnumerateArray().Take(4))
            {
                if (t.ValueKind != JsonValueKind.Object) continue;
                var topic = AiGuard.CleanOutput(Str(t, "topic"), 60);
                var what = AiGuard.CleanOutput(Str(t, "what"), 160);
                if (topic.Length == 0 || what.Length == 0) continue;
                var minutes = t.TryGetProperty("minutes", out var mi) && mi.TryGetInt32(out var mv) ? Math.Clamp(mv, 5, 180) : 20;
                outTasks.Add(new AiPlanTaskDto(topic, minutes, what));
            }
            if (outTasks.Count > 0) outDays.Add(new AiPlanDayDto(day, outTasks));
        }

        if (outDays.Count == 0) return null;
        var title = AiGuard.CleanOutput(Str(plan, "title"), 60);
        return new AiPlanDto(title.Length == 0 ? "Çalışma planın" : title, outDays);
    }

    private static List<AiPracticeDto> ParsePractice(JsonElement root)
    {
        var list = new List<AiPracticeDto>();
        if (!root.TryGetProperty("practice", out var arr) || arr.ValueKind != JsonValueKind.Array) return list;

        foreach (var p in arr.EnumerateArray().Take(3))
        {
            if (p.ValueKind != JsonValueKind.Object) continue;
            var question = AiGuard.CleanOutput(Str(p, "question"), 400);
            var explanation = AiGuard.CleanOutput(Str(p, "explanation"), 400);
            if (question.Length == 0 || !p.TryGetProperty("options", out var opts) || opts.ValueKind != JsonValueKind.Array) continue;

            var options = opts.EnumerateArray()
                .Where(o => o.ValueKind == JsonValueKind.String)
                .Select(o => AiGuard.CleanOutput(o.GetString(), 120))
                .ToList();
            // tam 4 şık, hepsi dolu ve birbirinden farklı
            if (options.Count != 4 || options.Any(o => o.Length == 0) ||
                options.Distinct(StringComparer.OrdinalIgnoreCase).Count() != 4) continue;

            if (!p.TryGetProperty("correctIndex", out var ci) || !ci.TryGetInt32(out var idx) || idx is < 0 or > 3) continue;

            var course = AiGuard.CleanOutput(Str(p, "course"), 60);
            list.Add(new AiPracticeDto(course, question, options, idx, explanation));
        }
        return list;
    }

    private static List<string> ParseSuggestions(JsonElement root)
    {
        var list = new List<string>();
        if (!root.TryGetProperty("suggestions", out var arr) || arr.ValueKind != JsonValueKind.Array) return list;
        foreach (var s in arr.EnumerateArray().Take(3))
        {
            if (s.ValueKind != JsonValueKind.String) continue;
            var t = AiGuard.CleanOutput(s.GetString(), 40);
            if (t.Length is > 0 and <= 32 && !list.Contains(t)) list.Add(t);
        }
        return list;
    }

    private static string Str(JsonElement e, string name)
        => e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() ?? "" : "";
}
