using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Shared;

public static class DbExceptionExtensions
{
    /// <summary>2601: unique index ihlali, 2627: unique constraint ihlali.</summary>
    public static bool IsUniqueViolation(this DbUpdateException ex)
        => ex.InnerException is SqlException { Number: 2601 or 2627 };


    /// <summary>Belirli bir unique index'in ihlali mi? (Hata mesajı indeks adını içerir.)</summary>
    public static bool IsUniqueViolation(this DbUpdateException ex, string indexName)
        => ex.InnerException is SqlException { Number: 2601 or 2627 } se
           && se.Message.Contains(indexName, StringComparison.OrdinalIgnoreCase);
}