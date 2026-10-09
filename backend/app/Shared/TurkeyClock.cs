namespace Dersakis.Shared;

/// <summary>
/// Türkiye 2016'dan beri sabit UTC+3. Günlük kredi tavanı gibi "gün" sınırları buna göre hesaplanır.
/// Saat dilimi veritabanı yerine sabit offset ile çözülür, Windows/Linux farkı olmaz.
/// </summary>
public static class TurkeyClock
{
    private static readonly TimeSpan Offset = TimeSpan.FromHours(3);

    public static DateOnly Today(TimeProvider clock)
        => DateOnly.FromDateTime(clock.GetUtcNow().ToOffset(Offset).DateTime);

    /// <summary>Türkiye saatiyle bugünün 00:00'ının UTC karşılığı (günlük limit sorguları için).</summary>
    public static DateTime StartOfTodayUtc(TimeProvider clock)
        => DateTime.SpecifyKind(Today(clock).ToDateTime(TimeOnly.MinValue).Subtract(Offset), DateTimeKind.Utc);
}