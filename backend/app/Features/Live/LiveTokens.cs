using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Services;

namespace Dersakis.Features.Live;

public sealed record LiveTokenDto(
    string AppId, string ChannelName, string Uid, string Token, DateTime ExpiresAtUtc, string MediaType);

internal static class LiveTokens
{
    /// <summary>
    /// Token yalnızca katılımcıya, oturum katılıma açıkken ve KENDİ join çağrısı kaydedildikten sonra verilir.
    /// Böylece /join çağrılmadan token almak (ve süreyi atlatmak) mümkün olmaz.
    /// </summary>
    public static bool Allowed(LiveSession s, Guid userId)
    {
        var host = s.HostId == userId;
        var guest = s.GuestId == userId;
        if (!host && !guest) return false;

        var joined = host ? s.HostJoinedAtUtc != null : s.GuestJoinedAtUtc != null;
        if (!joined) return false;

        return s.Kind == LiveKind.Voice
            ? s.Status is LiveStatus.Pending or LiveStatus.Live
            : s.Status is LiveStatus.Waiting or LiveStatus.Live;
    }

    public static LiveTokenDto Issue(
        LiveSession s, Guid userId, AgoraSettings agora, LiveSettings live, TimeProvider clock)
    {
        var now = clock.GetUtcNow().UtcDateTime;

        // Token, oturumun en geç biteceği ana + tolerans kadar geçerli olur.
        var end = s.Kind == LiveKind.Voice
            ? (s.Status == LiveStatus.Live ? s.LiveStartedAtUtc!.Value : s.JoinDeadlineUtc!.Value)
                .AddMinutes(live.VoiceMaxDurationMinutes)
            : s.ScheduledAtUtc!.Value.AddMinutes(s.DurationMinutes!.Value);
        end = end.AddMinutes(live.TokenGraceMinutes);

        var seconds = Math.Clamp((long)(end - now).TotalSeconds, 60, 24 * 3600);
        var lifetime = TimeSpan.FromSeconds(seconds);

        var channel = s.Id.ToString("N");
        var uid = userId.ToString();
        var video = s.Kind == LiveKind.Lesson;
        var token = AgoraRtcToken.Build(agora, channel, uid, video, lifetime, clock);

        return new LiveTokenDto(agora.AppId, channel, uid, token, now + lifetime, video ? "video" : "audio");
    }
}