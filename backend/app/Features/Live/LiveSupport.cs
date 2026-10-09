using Dersakis.Shared;
using Microsoft.Data.SqlClient;

namespace Dersakis.Features.Live;

/// <summary>Beklenen red durumu. İstisna olarak fırlatılır ki transaction GERİ ALINSIN.</summary>
internal sealed class LiveRejected(IResult response) : Exception
{
    public IResult Response { get; } = response;
    public static LiveRejected From(Error e) => new(Result.Failure(e).ToProblem());
}

internal static class LiveErrors
{
    /// <summary>
    /// ExecuteUpdate unique ihlalinde DbUpdateException değil ham SqlException fırlatır.
    /// 2601/2627 numaralı hata ve ilgili index adı mesajda geçiyorsa true döner.
    /// </summary>
    public static bool IsUniqueViolation(Exception ex, string indexName)
    {
        for (var e = ex; e is not null; e = e.InnerException)
            if (e is SqlException { Number: 2601 or 2627 } sql && sql.Message.Contains(indexName, StringComparison.Ordinal))
                return true;
        return false;
    }
}