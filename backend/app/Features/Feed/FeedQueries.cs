using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Features.Profile;
using Dersakis.Infrastructure.Database;

namespace Dersakis.Features.Feed;

public sealed record FeedItemDto(
    Guid Id, string Title, string Topic, Guid CourseId, string CourseName,
    Guid CreatorId, string CreatorName, string? CreatorAvatarUrl, bool IsMine,
    int DurationMs, int QuestionCount, bool WatchCompleted, bool Saved, bool Learned, string StreamUrl);

public sealed record FeedResponse(IReadOnlyList<FeedItemDto> Items, long? NextCursor);

internal sealed class FeedRow
{
    public Guid Id { get; init; }
    public required string Title { get; init; }
    public required string Topic { get; init; }
    public Guid CourseId { get; init; }
    public required string CourseName { get; init; }
    public Guid CreatorId { get; init; }
    public required string CreatorName { get; init; }
    public DateTime? CreatorAvatarAtUtc { get; init; }
    public int DurationMs { get; init; }
    public int QuestionCount { get; init; }
    public bool WatchCompleted { get; init; }
    public bool Saved { get; init; }
    public bool Learned { get; init; }
    public long Seq { get; init; }
}

internal static class FeedQueries
{
    /// <summary>Videoları feed satırına çevirir. Kaydetme/öğrendim/izleme bilgileri EXISTS alt sorgusu olur, N+1 yok.</summary>
    public static IQueryable<FeedRow> Project(AppDbContext db, IQueryable<Video> videos, Guid userId)
        => from v in videos
           join u in db.Users on v.CreatorId equals u.Id
           join c in db.Courses on v.CourseId equals c.Id
           select new FeedRow
           {
               Id = v.Id,
               Title = v.Title,
               Topic = v.Topic,
               CourseId = v.CourseId,
               CourseName = c.Name,
               CreatorId = v.CreatorId,
               CreatorName = u.DisplayName,
               CreatorAvatarAtUtc = u.AvatarUpdatedAtUtc,
               DurationMs = v.DurationMs!.Value,
               QuestionCount = v.Questions.Count,
               WatchCompleted = db.WatchSessions.Any(w =>
                   w.UserId == userId && w.VideoId == v.Id && w.Status == WatchStatus.Completed),
               Saved = db.VideoMarks.Any(m =>
                   m.UserId == userId && m.VideoId == v.Id && m.Kind == VideoMarkKind.Saved),
               Learned = db.VideoMarks.Any(m =>
                   m.UserId == userId && m.VideoId == v.Id && m.Kind == VideoMarkKind.Learned),
               Seq = v.PublishSeq!.Value
           };

    public static FeedItemDto ToDto(FeedRow r, Guid userId) => new(
        r.Id, r.Title, r.Topic, r.CourseId, r.CourseName, r.CreatorId, r.CreatorName,
        AvatarUrls.For(r.CreatorId, r.CreatorAvatarAtUtc), r.CreatorId == userId,
        r.DurationMs, r.QuestionCount, r.WatchCompleted, r.Saved, r.Learned, $"/api/v1/videos/{r.Id}/stream");
}