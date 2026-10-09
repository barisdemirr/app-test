using Dersakis.Domain.Entities;
using Dersakis.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Services;

public static class QaQueries
{
    /// <summary>
    /// Soru satırını UPDLOCK ile okur. Cevap yazma, düzenleme, en iyi seçme ve otomatik ödül bu kilit üzerinden sıraya girer.
    /// KİLİT SIRASI KURALI: önce soru satırı, sonra kredi hesapları. Hiçbir yerde tersi yapılmaz, deadlock bu yüzden oluşmaz.
    /// SADECE RunInTransactionAsync içinde çağrılmalı (kilit transaction bitince kalkar).
    /// </summary>
    public static Task<QaQuestion?> FindQuestionLockedAsync(this AppDbContext db, Guid id, CancellationToken ct)
        => db.QaQuestions
            .FromSqlInterpolated($"SELECT * FROM QaQuestions WITH (UPDLOCK, ROWLOCK) WHERE Id = {id}")
            .AsNoTracking()
            .FirstOrDefaultAsync(ct);
}