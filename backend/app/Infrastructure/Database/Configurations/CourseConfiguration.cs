using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> b)
    {
        b.ToTable("Courses");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Name).HasMaxLength(60).IsRequired();
        b.Property(x => x.Slug).HasMaxLength(60).IsRequired();
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");
        b.HasIndex(x => x.Slug).IsUnique().HasDatabaseName("UX_Courses_Slug");

        // Sabit Id ve sabit tarih: migration her üretildiğinde aynı çıksın (deterministik seed).
        var seeded = new DateTime(2026, 10, 9, 0, 0, 0, DateTimeKind.Utc);
        b.HasData(
            new { Id = Guid.Parse("0b1e0001-0000-4000-8000-000000000001"), Name = "Matematik 1", Slug = "matematik-1", SortOrder = 1, CreatedAtUtc = seeded },
            new { Id = Guid.Parse("0b1e0001-0000-4000-8000-000000000002"), Name = "Fizik 1", Slug = "fizik-1", SortOrder = 2, CreatedAtUtc = seeded },
            new { Id = Guid.Parse("0b1e0001-0000-4000-8000-000000000003"), Name = "Genel Kimya", Slug = "genel-kimya", SortOrder = 3, CreatedAtUtc = seeded },
            new { Id = Guid.Parse("0b1e0001-0000-4000-8000-000000000004"), Name = "Anatomi", Slug = "anatomi", SortOrder = 4, CreatedAtUtc = seeded },
            new { Id = Guid.Parse("0b1e0001-0000-4000-8000-000000000005"), Name = "Hücre Biyolojisi", Slug = "hucre-biyolojisi", SortOrder = 5, CreatedAtUtc = seeded });
    }
}