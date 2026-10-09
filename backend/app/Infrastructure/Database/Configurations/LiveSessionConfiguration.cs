using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class LiveSessionConfiguration : IEntityTypeConfiguration<LiveSession>
{
    public void Configure(EntityTypeBuilder<LiveSession> b)
    {
        b.ToTable("LiveSessions", t =>
        {
            t.HasCheckConstraint("CK_LiveSessions_Kind", "[Kind] IN (1, 2)");
            t.HasCheckConstraint("CK_LiveSessions_Status", "[Status] BETWEEN 1 AND 10");
            t.HasCheckConstraint("CK_LiveSessions_Outcome", "[Outcome] BETWEEN 0 AND 7");
            t.HasCheckConstraint("CK_LiveSessions_Price", "[Price] > 0");
            t.HasCheckConstraint("CK_LiveSessions_Payout", "[Payout] >= 0 AND [Payout] <= [Price]");
            // Tutulan kredi ne eksiye düşebilir ne fiyatı aşabilir: çift iade/çift ödeme DB'de de durur.
            t.HasCheckConstraint("CK_LiveSessions_Escrow", "[EscrowCredits] >= 0 AND [EscrowCredits] <= [Price]");
            t.HasCheckConstraint("CK_LiveSessions_NotSelf", "[GuestId] IS NULL OR [GuestId] <> [HostId]");
            t.HasCheckConstraint("CK_LiveSessions_LessonFields",
                "[Kind] = 1 OR ([ScheduledAtUtc] IS NOT NULL AND [DurationMinutes] IS NOT NULL)");
        });

        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Kind).HasConversion<byte>().HasColumnType("tinyint");
        b.Property(x => x.Status).HasConversion<byte>().HasColumnType("tinyint");
        b.Property(x => x.Outcome).HasConversion<byte>().HasColumnType("tinyint");
        b.Property(x => x.Title).HasMaxLength(80).IsRequired();
        b.Property(x => x.Description).HasMaxLength(500).IsRequired();

        foreach (var name in new[]
        {
            nameof(LiveSession.CreatedAtUtc), nameof(LiveSession.ScheduledAtUtc), nameof(LiveSession.JoinDeadlineUtc),
            nameof(LiveSession.ApprovalDeadlineUtc), nameof(LiveSession.HostJoinedAtUtc), nameof(LiveSession.GuestJoinedAtUtc),
            nameof(LiveSession.LiveStartedAtUtc), nameof(LiveSession.EndedAtUtc), nameof(LiveSession.SettledAtUtc),
            nameof(LiveSession.DueAtUtc)
        })
            b.Property(name).HasColumnType("datetime2(3)");

        // Job tek sorguyla "vakti gelen" satırları bulur.
        b.HasIndex(x => x.DueAtUtc).HasFilter("[DueAtUtc] IS NOT NULL").HasDatabaseName("IX_LiveSessions_DueAtUtc");

        // İlan listeleri
        b.HasIndex(x => new { x.Kind, x.Status, x.CreatedAtUtc }).HasDatabaseName("IX_LiveSessions_Kind_Status_CreatedAtUtc");
        b.HasIndex(x => new { x.CourseId, x.Kind, x.Status }).HasDatabaseName("IX_LiveSessions_CourseId_Kind_Status");

        // Kullanıcı aynı anda yalnızca bir aktif (Pending=4, Waiting=5, Live=6) oturumda host, bir tanesinde misafir olabilir.
        b.HasIndex(x => x.HostId).IsUnique()
            .HasFilter("[Status] >= 4 AND [Status] <= 6").HasDatabaseName("UX_LiveSessions_Host_Active");
        b.HasIndex(x => x.GuestId).IsUnique()
            .HasFilter("[GuestId] IS NOT NULL AND [Status] >= 4 AND [Status] <= 6").HasDatabaseName("UX_LiveSessions_Guest_Active");

        // Kullanıcının geçmişi
        b.HasIndex(x => new { x.HostId, x.CreatedAtUtc }).HasDatabaseName("IX_LiveSessions_HostId_CreatedAtUtc");
        b.HasIndex(x => new { x.GuestId, x.CreatedAtUtc })
            .HasFilter("[GuestId] IS NOT NULL").HasDatabaseName("IX_LiveSessions_GuestId_CreatedAtUtc");

        // Finansal kayıtlar zincirleme silinmez.
        b.HasOne<User>().WithMany().HasForeignKey(x => x.HostId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<User>().WithMany().HasForeignKey(x => x.GuestId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Course>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Restrict);
    }
}