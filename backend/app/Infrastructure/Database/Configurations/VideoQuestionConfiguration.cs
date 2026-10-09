using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class VideoQuestionConfiguration : IEntityTypeConfiguration<VideoQuestion>
{
    public void Configure(EntityTypeBuilder<VideoQuestion> b)
    {
        b.ToTable("VideoQuestions", t => t.HasCheckConstraint("CK_VideoQuestions_Position", "[Position] IN (1, 2)"));
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Text).HasMaxLength(300).IsRequired();
        b.Property(x => x.Explanation).HasMaxLength(500).IsRequired();
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");

        b.HasIndex(x => new { x.VideoId, x.Position }).IsUnique().HasDatabaseName("UX_VideoQuestions_VideoId_Position");
        b.HasMany(x => x.Options).WithOne().HasForeignKey(o => o.QuestionId).OnDelete(DeleteBehavior.Cascade);
    }
}