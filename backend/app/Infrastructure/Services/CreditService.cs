using System.Data;
using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Services;

public sealed record CreditChange(int Applied, int Balance, bool AlreadyApplied);

/// <summary>UPDATE ... OUTPUT sonucunu okumak için.</summary>
public sealed class CreditRow
{
    public int Balance { get; set; }
    public int Applied { get; set; }
}

public sealed class CreditService(AppDbContext db, CreditSettings settings, TimeProvider clock)
{
    // Bugün zaten kazanılmış miktar (gün değiştiyse 0)
    private const string TodayBase = "CASE WHEN DailyEarnedDay = @today THEN DailyEarned ELSE 0 END";

    // Bu çağrıda verilecek miktar: tam ödül, tavana az kaldıysa kalan kadar, tavan dolduysa 0
    private const string Granted =
        $"CASE WHEN {TodayBase} + @amount <= @cap THEN @amount WHEN {TodayBase} < @cap THEN @cap - {TodayBase} ELSE 0 END";

    // SET içindeki tüm ifadeler satırın ESKİ değerine göre hesaplanır, bu yüzden bu tek UPDATE atomiktir.
    private const string EarnSql = $@"
UPDATE Users SET
    CreditBalance  = CreditBalance + ({Granted}),
    DailyEarned    = ({TodayBase}) + ({Granted}),
    DailyEarnedDay = @today
OUTPUT inserted.CreditBalance AS Balance, inserted.CreditBalance - deleted.CreditBalance AS Applied
WHERE Id = @userId";

    private const string GrantSql = @"
UPDATE Users SET CreditBalance = CreditBalance + @amount
OUTPUT inserted.CreditBalance AS Balance, inserted.CreditBalance - deleted.CreditBalance AS Applied
WHERE Id = @userId";

    // Bakiye yetmiyorsa WHERE sağlanmaz, 0 satır döner.
    private const string SpendSql = @"
UPDATE Users SET CreditBalance = CreditBalance - @amount
OUTPUT inserted.CreditBalance AS Balance, deleted.CreditBalance - inserted.CreditBalance AS Applied
WHERE Id = @userId AND CreditBalance >= @amount";

    /// <summary>Günlük tavana SAYILMAYAN kredi ekler (kayıt bonusu gibi).</summary>
    public Task<Result<CreditChange>> GrantAsync(Guid userId, int amount, CreditReason reason, Guid refId, CancellationToken ct)
        => amount <= 0
            ? Task.FromResult(InvalidAmount())
            : ApplyAsync(userId, reason, refId, +1,
                token => QueryRowAsync(GrantSql, token,
                    new SqlParameter("@userId", userId), new SqlParameter("@amount", amount)), ct);

    /// <summary>Günlük tavana sayılan kazanım (quiz ödülü). Tavan dolmuşsa Applied = 0 döner.</summary>
    public Task<Result<CreditChange>> EarnAsync(Guid userId, int amount, CreditReason reason, Guid refId, CancellationToken ct)
    {
        if (amount <= 0) return Task.FromResult(InvalidAmount());

        var today = TurkeyClock.Today(clock).ToDateTime(TimeOnly.MinValue);
        return ApplyAsync(userId, reason, refId, +1,
            token => QueryRowAsync(EarnSql, token,
                new SqlParameter("@userId", userId),
                new SqlParameter("@amount", amount),
                new SqlParameter("@cap", settings.DailyCap),
                new SqlParameter("@today", SqlDbType.Date) { Value = today }), ct);
    }

    /// <summary>Kredi harcar. Bakiye yetmiyorsa 409 insufficient_credits, bakiye asla eksiye düşmez.</summary>
    public Task<Result<CreditChange>> SpendAsync(Guid userId, int amount, CreditReason reason, Guid refId, CancellationToken ct)
        => amount <= 0
            ? Task.FromResult(InvalidAmount())
            : ApplyAsync(userId, reason, refId, -1,
                token => QueryRowAsync(SpendSql, token,
                    new SqlParameter("@userId", userId), new SqlParameter("@amount", amount)), ct);

    /// <summary>
    /// Kullanıcı satırını işlem sonuna kadar kilitler. Boş bir UPDATE bile satırda exclusive kilit alır.
    /// Başka tabloya yazıp kredi de verecek işlemler transaction'ın İLK adımı olarak bunu çağırmalı.
    /// </summary>
    public async Task<bool> LockAccountAsync(Guid userId, CancellationToken ct)
        => await db.Database.ExecuteSqlInterpolatedAsync(
               $"UPDATE Users SET CreditBalance = CreditBalance WHERE Id = {userId}", ct) == 1;

    private Task<Result<CreditChange>> ApplyAsync(
        Guid userId, CreditReason reason, Guid refId, int sign,
        Func<CancellationToken, Task<CreditRow?>> mutate, CancellationToken ct)
        => db.RunInTransactionAsync<Result<CreditChange>>(async token =>
        {
            // 1) Kilit: aynı kullanıcının kredi işlemleri buradan sonra tek tek sıraya girer.
            if (!await LockAccountAsync(userId, token))
                return Result.Failure<CreditChange>(Error.NotFound("user_not_found", "Hesap bulunamadı."));

            // 2) Bu (kullanıcı, sebep, referans) daha önce uygulanmış mı? Kilit sayesinde bu kontrol yarışsız.
            //    Unique index zaten son güvence; bu kontrol sadece hatasız ve temiz cevap içindir.
            var already = await db.CreditTransactions.AsNoTracking()
                .AnyAsync(t => t.UserId == userId && t.Reason == reason && t.RefId == refId, token);
            if (already)
            {
                var current = await db.Users.AsNoTracking()
                    .Where(u => u.Id == userId).Select(u => u.CreditBalance).FirstAsync(token);
                return new CreditChange(0, current, AlreadyApplied: true);
            }

            // 3) Atomik bakiye değişimi
            var row = await mutate(token);
            if (row is null)
                return Result.Failure<CreditChange>(Error.Conflict("insufficient_credits", "Yeterli kredin yok."));

            // 4) Ledger kaydı: bakiye değişimiyle AYNI transaction'da
            var now = clock.GetUtcNow().UtcDateTime;
            await db.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO CreditTransactions (Id, UserId, Amount, BalanceAfter, Reason, RefId, CreatedAtUtc)
                VALUES ({Guid.CreateVersion7()}, {userId}, {sign * row.Applied}, {row.Balance}, {(byte)reason}, {refId}, {now})", token);

            return new CreditChange(row.Applied, row.Balance, AlreadyApplied: false);
        }, ct);

    /// <summary>
    /// UPDATE ... OUTPUT bir SELECT gibi sarmalanamaz. AsAsyncEnumerable() EF'e "üstüne sorgu ekleme" der.
    /// </summary>
    private async Task<CreditRow?> QueryRowAsync(string sql, CancellationToken ct, params SqlParameter[] parameters)
    {
        var rows = new List<CreditRow>(1);
        await foreach (var r in db.Database.SqlQueryRaw<CreditRow>(sql, parameters).AsAsyncEnumerable().WithCancellation(ct))
            rows.Add(r);
        return rows.FirstOrDefault();
    }

    private static Result<CreditChange> InvalidAmount()
        => Result.Failure<CreditChange>(Error.Validation("invalid_amount", "Kredi miktarı pozitif olmalı."));
}