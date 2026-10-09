namespace Dersakis.Infrastructure.Services;

public sealed class VideoSettings
{
    public string StorageRoot { get; init; } = "App_Data/videos";
    public long MaxFileBytes { get; init; } = 100L * 1024 * 1024;
    public int MinDurationSeconds { get; init; } = 20;
    public int MaxDurationSeconds { get; init; } = 120;
    public int MinBytesPerSecond { get; init; } = 2048;   // sahte/boş videoları ayıklamak için çok gevşek bir taban
    public int MaxCreatesPerDay { get; init; } = 20;

    public VideoSettings EnsureValid()
    {
        if (string.IsNullOrWhiteSpace(StorageRoot)) throw new InvalidOperationException("Videos:StorageRoot boş olamaz.");
        if (MaxFileBytes is < 1_048_576 or > 500L * 1024 * 1024) throw new InvalidOperationException("Videos:MaxFileBytes 1 MB ile 500 MB arasında olmalı.");
        if (MinDurationSeconds < 5 || MaxDurationSeconds <= MinDurationSeconds) throw new InvalidOperationException("Videos:süre aralığı geçersiz.");
        if (MinBytesPerSecond < 0) throw new InvalidOperationException("Videos:MinBytesPerSecond negatif olamaz.");
        if (MaxCreatesPerDay < 1) throw new InvalidOperationException("Videos:MaxCreatesPerDay en az 1 olmalı.");
        return this;
    }
}