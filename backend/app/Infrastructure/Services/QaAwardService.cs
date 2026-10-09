using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Services;

public sealed record AwardResult(Guid QuestionId, Guid AnswerId, Guid AnswererId, int Reward, QaChosenBy ChosenBy, bool AlreadyChosen);

public sealed class QaAwardService(AppDbContext db, CreditService credits, QaSettings cfg, TimeProvider clock)
{
    /// <summary>Soran, bir cevabı en iyi seçer. Aynı cevabı tekrar seçmek zararsızdır (AlreadyChosen).</summary>
    public Task<Result<AwardResult>> ChooseBestAsync(Guid questionId, Guid answerId, Guid askerId, CancellationToken ct)
        => db.RunInTransactionAsync<Result<AwardResult>>(async token =>
        {
            var q = await db.FindQuestionLockedAsync(questionId, token);
            if (q is null) return Error.NotFound("qa_question_not_found", "Soru bulunamadı.");
            if (q.AuthorId != askerId) return Error.Forbidden("not_question_author", "En iyi cevabı yalnızca soruyu soran seçebilir.");
            if (q.Mode != QaMode.Text) return Error.Conflict("voice_question", "Sesli sorularda ödül görüşme üzerinden verilir.");

            if (q.BestAnswerId is { } existing)
            {
                if (existing != answerId) return Error.Conflict("best_answer_already_chosen", "Bu soruda en iyi cevap zaten seçildi.");
                var author = await db.QaAnswers.AsNoTracking().Where(a => a.Id == existing).Select(a => a.AuthorId).FirstAsync(token);
                return new AwardResult(q.Id, existing, author, q.Reward, q.BestChosenBy ?? QaChosenBy.Asker, AlreadyChosen: true);
            }

            var now = clock.GetUtcNow().UtcDateTime;
            if (q.FirstAnswerAtUtc is { } first && now >= first.AddDays(cfg.BestAnswerWindowDays))
                return Error.Conflict("selection_period_over", "Seçim süresi doldu, ödül ilk cevaplayana verilecek.");

            var answererId = await db.QaAnswers.AsNoTracking()
                .Where(a => a.Id == answerId && a.QuestionId == questionId).Select(a => (Guid?)a.AuthorId).FirstOrDefaultAsync(token);
            if (answererId is null) return Error.NotFound("answer_not_found", "Cevap bu soruya ait değil veya bulunamadı.");

            return await AwardAsync(q, answerId.Value, answererId.Value, QaChosenBy.Asker, token);
        }, ct);

    /// <summary>Süre dolduysa ve seçim yapılmadıysa ödül ilk cevaplayana verilir. Arka plan servisi çağırır.</summary>
    public Task<Result<AwardResult>> AutoAwardAsync(Guid questionId, CancellationToken ct)
        => db.RunInTransactionAsync<Result<AwardResult>>(async token =>
        {
            var q = await db.FindQuestionLockedAsync(questionId, token);
            if (q is null || q.BestAnswerId is not null || q.Mode != QaMode.Text || q.FirstAnswerAtUtc is not { } first)
                return Error.Conflict("not_due", "Ödül bekleyen soru değil.");

            var now = clock.GetUtcNow().UtcDateTime;
            if (now < first.AddDays(cfg.BestAnswerWindowDays))
                return Error.Conflict("not_due", "Seçim süresi henüz dolmadı.");

            var firstAnswer = await db.QaAnswers.AsNoTracking()
                .Where(a => a.QuestionId == questionId)
                .OrderBy(a => a.CreatedAtUtc).ThenBy(a => a.Id)
                .Select(a => new { a.Id, a.AuthorId }).FirstOrDefaultAsync(token);
            if (firstAnswer is null) return Error.Conflict("not_due", "Cevap yok.");

            return await AwardAsync(q, firstAnswer.Id, firstAnswer.AuthorId, QaChosenBy.Auto, token);
        }, ct);

    /// <summary>Çağıran, soru satırını ZATEN kilitlemiş olmalı. Önce soru güncellenir, sonra cevaplayanın hesabı (kilit sırası).</summary>
    private async Task<Result<AwardResult>> AwardAsync(QaQuestion q, Guid answerId, Guid answererId, QaChosenBy by, CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;

        var rows = await db.QaQuestions.Where(x => x.Id == q.Id && x.BestAnswerId == null).ExecuteUpdateAsync(s => s
            .SetProperty(x => x.BestAnswerId, (Guid?)answerId)
            .SetProperty(x => x.BestChosenAtUtc, (DateTime?)now)
            .SetProperty(x => x.BestChosenBy, (QaChosenBy?)by), ct);
        if (rows != 1) return Error.Conflict("best_answer_already_chosen", "Bu soruda en iyi cevap zaten seçildi.");

        // Ödül günlük tavana sayılmaz (GrantAsync). RefId = soru id'si: aynı soru için ikinci ödül ledger'da imkansız.
        var grant = await credits.GrantAsync(answererId, q.Reward, CreditReason.QaBestAnswer, q.Id, ct);
        if (grant.IsFailure)
            throw new InvalidOperationException($"Ödül verilemedi: {grant.Error!.Code}"); // transaction geri alınır

        return new AwardResult(q.Id, answerId, answererId, q.Reward, by, AlreadyChosen: false);
    }
}