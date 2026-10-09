using Microsoft.EntityFrameworkCore;

namespace Dersakis.Shared;

public static class DbTransactions
{
    /// <summary>
    /// work, tek bir transaction içinde çalışır. Deadlock (1205) veya geçici hata olursa blok BAŞTAN tekrar
    /// çalışır, bu yüzden work içinde dış dünyaya yan etki (mail, HTTP çağrısı) bulunmamalı.
    /// Dışarıda zaten açık bir transaction varsa ona katılır.
    /// </summary>
    public static async Task<T> RunInTransactionAsync<T>(
        this DbContext db, Func<CancellationToken, Task<T>> work, CancellationToken ct)
    {
        if (db.Database.CurrentTransaction is not null)
            return await work(ct);

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async token =>
        {
            db.ChangeTracker.Clear(); // önceki denemeden kalan takip edilen nesneleri at
            await using var tx = await db.Database.BeginTransactionAsync(token);
            var result = await work(token);
            await tx.CommitAsync(token);
            return result;
        }, ct);
    }
}