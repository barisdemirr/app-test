namespace Dersakis.Infrastructure.Services;

public sealed class PushSettings
{
    public bool Enabled { get; init; } = true;                 // false: push gönderilmez, bildirim kutusu yine çalışır
    public string ExpoEndpoint { get; init; } = "https://exp.host/--/api/v2/push/send";
    public string? ExpoAccessToken { get; init; }              // yalnızca user-secrets (Expo "enhanced security" açıksa)
    public int DispatchIntervalSeconds { get; init; } = 3;
    public int BatchSize { get; init; } = 50;
    public int MaxAttempts { get; init; } = 5;
    public int RetentionDays { get; init; } = 30;

    public PushSettings EnsureValid()
    {
        if (!Uri.TryCreate(ExpoEndpoint, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
            throw new InvalidOperationException("Push:ExpoEndpoint geçerli bir https adresi olmalı.");
        if (DispatchIntervalSeconds is < 1 or > 60) throw new InvalidOperationException("Push:DispatchIntervalSeconds 1-60 arasında olmalı.");
        if (BatchSize is < 1 or > 500) throw new InvalidOperationException("Push:BatchSize 1-500 arasında olmalı.");
        if (MaxAttempts is < 1 or > 10) throw new InvalidOperationException("Push:MaxAttempts 1-10 arasında olmalı.");
        if (RetentionDays is < 1 or > 365) throw new InvalidOperationException("Push:RetentionDays 1-365 arasında olmalı.");
        return this;
    }
}