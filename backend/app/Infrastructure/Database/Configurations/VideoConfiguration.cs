using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class VideoConfiguration : IEntityTypeConfiguration<Video>
{
    public void Configure(EntityTypeBuilder<Video> b)
    {
        // Status 2 = Published: yayındaki videoda süre, dosya ve sıra numarası eksik olamaz.
        b.ToTable("Videos", t => t.HasCheckConstraint("CK_Videos_Published_Complete",
            "[Status] <> 2 OR ([DurationMs] > 0 AND [StoragePath] IS NOT NULL AND [PublishSeq] IS NOT NULL)"));

        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Title).HasMaxLength(70).IsRequired();
        b.Property(x => x.Topic).HasMaxLength(40).IsRequired();
        b.Property(x => x.Status).HasConversion<byte>().HasColumnType("tinyint");
        b.Property(x => x.StoragePath).HasMaxLength(200).IsUnicode(false);
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.PublishedAtUtc).HasColumnType("datetime2(3)");

        // Akış indeksi: PublishSeq'e göre azalan tarama. Status ve CourseId filtre için "include" edilir.
        b.HasIndex(x => x.PublishSeq)
            .IsUnique().IsDescending()
            .HasFilter("[PublishSeq] IS NOT NULL")
            .IncludeProperties(x => new { x.Status, x.CourseId })
            .HasDatabaseName("UX_Videos_PublishSeq");

        // Günlük yükleme sayısı sorgusu için
        b.HasIndex(x => new { x.CreatorId, x.CreatedAtUtc }).HasDatabaseName("IX_Videos_CreatorId_CreatedAtUtc");

        b.HasOne<User>().WithMany().HasForeignKey(x => x.CreatorId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Course>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(x => x.Questions).WithOne().HasForeignKey(q => q.VideoId).OnDelete(DeleteBehavior.Cascade);
    }
}