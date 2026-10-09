using Dersakis.Domain.Enums;

namespace Dersakis.Infrastructure.Services.Push;

public sealed record PushMessage(string To, string Title, string Body, string? DataJson, int? TtlSeconds);

public enum PushResultKind { Ok, InvalidToken, Retry, Failed }

public sealed record PushResult(PushResultKind Kind, string? Error);

/// <summary>Yeni bir sağlayıcı (ör. FCM) eklemek bu arayüzü uygulamak demektir, iş mantığı değişmez.</summary>
public interface IPushSender
{
    PushProvider Provider { get; }

    /// <summary>Dönen liste, gelen mesaj listesiyle aynı sırada ve aynı uzunluktadır.</summary>
    Task<IReadOnlyList<PushResult>> SendAsync(IReadOnlyList<PushMessage> messages, CancellationToken ct);
}