using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Features.Profile;
using Dersakis.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Live;

public sealed record LiveParticipantDto(Guid Id, string DisplayName, string? AvatarUrl);

public sealed record LiveSessionDto(
    Guid Id,
    string ChannelName,          // Agora kanal adı: oturum Id'si, tireler olmadan
    LiveKind Kind,
    string MediaType,            // "audio" (Voice) | "video" (Lesson)
    LiveStatus Status,
    string Phase,                // waiting | active | finished | cancelled
    LiveOutcome Outcome,
    string MyRole,               // host | guest | none
    bool CanJoin,                // /live/{id}/join şu an çağrılabilir mi
    bool CanBook,                // eğitim satın alınabilir mi (11.6)
    bool PeerJoined,             // karşı taraf kanala girdi mi
    Guid CourseId, string CourseName, string Title, string Description,
    int Price, int Payout,
    LiveParticipantDto Host, LiveParticipantDto? Guest,
    DateTime? ScheduledAtUtc, int? DurationMinutes,
    DateTime? JoinDeadlineUtc, DateTime? ApprovalDeadlineUtc, DateTime? LiveStartedAtUtc,
    DateTime CreatedAtUtc, DateTime ServerNowUtc);

internal sealed class LiveRow
{
    public required LiveSession Session { get; init; }
    public required string CourseName { get; init; }
    public required string HostName { get; init; }
    public DateTime? HostAvatarAt { get; init; }
    public string? GuestName { get; init; }
    public DateTime? GuestAvatarAt { get; init; }
}

internal static class LiveQueries
{
    public static IQueryable<LiveRow> Project(AppDbContext db, IQueryable<LiveSession> sessions)
        => from s in sessions
           join h in db.Users on s.HostId equals h.Id
           join c in db.Courses on s.CourseId equals c.Id
           join g0 in db.Users on s.GuestId equals (Guid?)g0.Id into gs
           from g in gs.DefaultIfEmpty()
           select new LiveRow
           {
               Session = s,
               CourseName = c.Name,
               HostName = h.DisplayName,
               HostAvatarAt = h.AvatarUpdatedAtUtc,
               GuestName = g == null ? null : g.DisplayName,
               GuestAvatarAt = g == null ? null : g.AvatarUpdatedAtUtc
           };

    public static Task<LiveRow?> LoadAsync(AppDbContext db, Guid id, CancellationToken ct)
        => Project(db, db.LiveSessions.AsNoTracking().Where(s => s.Id == id)).FirstOrDefaultAsync(ct);

    public static string RoleOf(LiveSession s, Guid userId)
        => s.HostId == userId ? "host" : s.GuestId == userId ? "guest" : "none";

    /// <summary>Katılımcılar her zaman görür. Diğerleri yalnızca satışta olan ilanı görür.</summary>
    public static bool IsVisible(LiveSession s, string role)
        => role != "none"
           || (s.Kind == LiveKind.Voice && s.Status == LiveStatus.Open)
           || (s.Kind == LiveKind.Lesson && s.Status == LiveStatus.Listed);

    public static LiveSessionDto ToDto(LiveRow r, Guid userId, DateTime now)
    {
        var s = r.Session;
        var role = RoleOf(s, userId);

        var phase = s.Status switch
        {
            LiveStatus.Live => "active",
            LiveStatus.AwaitingApproval or LiveStatus.Completed => "finished",
            LiveStatus.Cancelled or LiveStatus.Expired => "cancelled",
            _ => "waiting"
        };

        var canJoin = s.Kind == LiveKind.Voice
            ? role switch
            {
                "none" => s.Status == LiveStatus.Open,
                "host" => s.Status == LiveStatus.Live || (s.Status == LiveStatus.Pending && s.JoinDeadlineUtc >= now),
                _ => s.Status is LiveStatus.Pending or LiveStatus.Live
            }
            : role != "none" && (s.Status == LiveStatus.Live || (s.Status == LiveStatus.Waiting && s.JoinDeadlineUtc >= now));

        var canBook = s.Kind == LiveKind.Lesson && s.Status == LiveStatus.Listed && role == "none" && s.ScheduledAtUtc > now;

        var peerJoined = role switch
        {
            "host" => s.GuestJoinedAtUtc != null,
            "guest" => s.HostJoinedAtUtc != null,
            _ => false
        };

        var guest = s.GuestId is { } gid && r.GuestName is not null
            ? new LiveParticipantDto(gid, r.GuestName, AvatarUrls.For(gid, r.GuestAvatarAt))
            : null;

        return new LiveSessionDto(
            s.Id, s.Id.ToString("N"), s.Kind, s.Kind == LiveKind.Voice ? "audio" : "video",
            s.Status, phase, s.Outcome, role, canJoin, canBook, peerJoined,
            s.CourseId, r.CourseName, s.Title, s.Description, s.Price, s.Payout,
            new LiveParticipantDto(s.HostId, r.HostName, AvatarUrls.For(s.HostId, r.HostAvatarAt)), guest,
            s.ScheduledAtUtc, s.DurationMinutes, s.JoinDeadlineUtc, s.ApprovalDeadlineUtc, s.LiveStartedAtUtc,
            s.CreatedAtUtc, now);
    }
}