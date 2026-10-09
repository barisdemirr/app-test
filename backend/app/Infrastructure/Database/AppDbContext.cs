using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Database;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<IdempotencyKey> IdempotencyKeys => Set<IdempotencyKey>();
    public DbSet<CreditTransaction> CreditTransactions => Set<CreditTransaction>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Video> Videos => Set<Video>();
    public DbSet<VideoQuestion> VideoQuestions => Set<VideoQuestion>();
    public DbSet<VideoOption> VideoOptions => Set<VideoOption>();
    public DbSet<WatchSession> WatchSessions => Set<WatchSession>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();
    public DbSet<QaQuestion> QaQuestions => Set<QaQuestion>();
    public DbSet<QaAnswer> QaAnswers => Set<QaAnswer>();
    public DbSet<PhoneVerification> PhoneVerifications => Set<PhoneVerification>();
    public DbSet<Reward> Rewards => Set<Reward>();
    public DbSet<RewardRedemption> RewardRedemptions => Set<RewardRedemption>();
    public DbSet<VideoMark> VideoMarks => Set<VideoMark>();
    public DbSet<UserCourse> UserCourses => Set<UserCourse>();
    public DbSet<UserInterest> UserInterests => Set<UserInterest>();
    public DbSet<LiveSession> LiveSessions => Set<LiveSession>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<DeviceToken> DeviceTokens => Set<DeviceToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Yayınlanma sırası: atomik, çakışmasız, boşluk olabilir (sorun değil).
        modelBuilder.HasSequence<long>("VideoPublishSeq");
        modelBuilder.HasSequence<long>("QaQuestionSeq");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}