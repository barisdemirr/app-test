using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class WatchSessionConfiguration : IEntityTypeConfiguration<WatchSession>
{
    public void Configure(EntityTypeBuilder<WatchSession> b)
    {
        b.ToTable("WatchSessions", t => t.HasCheckConstraint("CK_WatchSessions_Progress",
            "[WatchedMs] >= 0 AND [WatchedMs] <= [VideoDurationMs] AND [LastPositionMs] >= 0 AND [LastPositionMs] <= [VideoDurationMs]"));

        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Status).HasConversion<byte>().HasColumnType("tinyint");
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.LastHeartbeatAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.CompletedAtUtc).HasColumnType("datetime2(3)");

        // Kullanıcı başına tek aktif oturum: "20 videoyu paralel başlat, bir kez bekle" hilesini kapatır.
        b.HasIndex(x => x.UserId).IsUnique().HasFilter("[Status] = 1")
            .HasDatabaseName("UX_WatchSessions_OneActivePerUser");

        // (Kullanıcı, video) için tek tamamlanmış oturum. Commit 7'de soru cevaplama bunu kontrol edecek.
        b.HasIndex(x => new { x.UserId, x.VideoId }).IsUnique().HasFilter("[Status] = 2")
            .HasDatabaseName("UX_WatchSessions_OneCompletedPerVideo");

        // Temizlik servisi için
        b.HasIndex(x => new { x.Status, x.CreatedAtUtc }).HasDatabaseName("IX_WatchSessions_Status_CreatedAtUtc");

        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Video>().WithMany().HasForeignKey(x => x.VideoId).OnDelete(DeleteBehavior.Restrict);
    }
}