using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class VideoMarkConfiguration : IEntityTypeConfiguration<VideoMark>
{
    public void Configure(EntityTypeBuilder<VideoMark> b)
    {
        b.ToTable("VideoMarks", t => t.HasCheckConstraint("CK_VideoMarks_Kind", "[Kind] IN (1, 2)"));
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Kind).HasConversion<byte>().HasColumnType("tinyint");
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");

        // Bir kullanıcı bir videoyu bir kez kaydeder / bir kez "öğrendim" der. Paralel istek çift satır yaratamaz.
        b.HasIndex(x => new { x.UserId, x.VideoId, x.Kind }).IsUnique().HasDatabaseName("UX_VideoMarks_UserId_VideoId_Kind");
        // Üreticinin "öğrendim" toplamı için (Kind = 2)
        b.HasIndex(x => x.VideoId).HasFilter("[Kind] = 2").HasDatabaseName("IX_VideoMarks_VideoId_Learned");

        // İşaretler finansal kayıt değil: kullanıcı veya video silinirse birlikte gider.
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne<Video>().WithMany().HasForeignKey(x => x.VideoId).OnDelete(DeleteBehavior.Cascade);
    }
}