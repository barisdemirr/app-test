using Dersakis.Domain.Entities;
using Dersakis.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Services;

public static class WatchSessionQueries
{
    /// <summary>
    /// Oturum satırını UPDLOCK ile okur: aynı oturumun eşzamanlı heartbeat/complete istekleri sıraya girer.
    /// Kilit transaction bitince kalkar, bu yüzden SADECE RunInTransactionAsync içinde çağrılmalı.
    /// </summary>
    public static Task<WatchSession?> FindLockedAsync(this AppDbContext db, Guid id, Guid userId, CancellationToken ct)
        => db.WatchSessions
            .FromSqlInterpolated($"SELECT * FROM WatchSessions WITH (UPDLOCK, ROWLOCK) WHERE Id = {id} AND UserId = {userId}")
            .FirstOrDefaultAsync(ct);
}