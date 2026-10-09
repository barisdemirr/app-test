using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class VideoOptionConfiguration : IEntityTypeConfiguration<VideoOption>
{
    public void Configure(EntityTypeBuilder<VideoOption> b)
    {
        b.ToTable("VideoOptions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Text).HasMaxLength(150).IsRequired();
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");

        // Bir sorunun tam olarak BİR doğru şıkkı olabilir (en fazla bir, kodda da tam bir ekliyoruz).
        b.HasIndex(x => x.QuestionId).IsUnique().HasFilter("[IsCorrect] = 1")
            .HasDatabaseName("UX_VideoOptions_OneCorrectPerQuestion");
    }
}