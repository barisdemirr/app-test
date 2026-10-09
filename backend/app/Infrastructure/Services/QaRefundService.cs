using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Services;

public sealed record RefundResult(Guid QuestionId, Guid AuthorId, int Amount);

public sealed class QaRefundService(AppDbContext db, CreditService credits, QaSettings cfg, TimeProvider clock)
{
    /// <summary>
    /// Süre dolmuş ve hiç cevap almamış yazılı soruyu kapatıp fiyatını iade eder.
    /// Kilit sırası: önce soru satırı, sonra kredi hesabı (diğer tüm Bilene sor akışlarıyla aynı).
    /// </summary>
    public Task<Result<RefundResult>> RefundAsync(Guid questionId, CancellationToken ct)
        => db.RunInTransactionAsync<Result<RefundResult>>(async token =>
        {
            var q = await db.FindQuestionLockedAsync(questionId, token);
            var now = clock.GetUtcNow().UtcDateTime;

            if (q is null || q.RefundedAtUtc is not null || q.AnswerCount > 0 || q.BestAnswerId is not null
                || q.Mode != QaMode.Text || now < q.CreatedAtUtc.AddDays(cfg.NoAnswerRefundDays))
                return Error.Conflict("not_due", "İade bekleyen soru değil.");

            var rows = await db.QaQuestions
                .Where(x => x.Id == q.Id && x.RefundedAtUtc == null && x.AnswerCount == 0)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.RefundedAtUtc, (DateTime?)now), token);
            if (rows != 1) return Error.Conflict("not_due", "İade bekleyen soru değil.");

            // Soru açılırken alınan fiyat (config sonradan değişse de) aynen iade edilir. RefId = soru id'si.
            var grant = await credits.GrantAsync(q.AuthorId, q.Cost, CreditReason.QaQuestionRefund, q.Id, token);
            if (grant.IsFailure)
                throw new InvalidOperationException($"İade yapılamadı: {grant.Error!.Code}"); // transaction geri alınır

            return new RefundResult(q.Id, q.AuthorId, q.Cost);
        }, ct);
}