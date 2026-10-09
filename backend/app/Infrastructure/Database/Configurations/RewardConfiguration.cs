using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class RewardConfiguration : IEntityTypeConfiguration<Reward>
{
    public void Configure(EntityTypeBuilder<Reward> b)
    {
        b.ToTable("Rewards", t =>
        {
            t.HasCheckConstraint("CK_Rewards_Cost", "[Cost] > 0");
            // Stok eksiye düşemez: uygulama hata yapsa bile DB reddeder.
            t.HasCheckConstraint("CK_Rewards_Stock", "[StockRemaining] IS NULL OR [StockRemaining] >= 0");
            t.HasCheckConstraint("CK_Rewards_PerUserLimit", "[PerUserLimit] IS NULL OR [PerUserLimit] > 0");
        });

        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Title).HasMaxLength(80).IsRequired();
        b.Property(x => x.Description).HasMaxLength(300).IsRequired();
        b.Property(x => x.Provider).HasMaxLength(60).IsRequired();
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");
        b.HasIndex(x => new { x.IsActive, x.SortOrder }).HasDatabaseName("IX_Rewards_IsActive_SortOrder");

        // Sabit Id ve sabit tarih: migration her üretildiğinde aynı çıksın (deterministik seed).
        var seeded = new DateTime(2026, 10, 9, 0, 0, 0, DateTimeKind.Utc);
        b.HasData(
            new
            {
                Id = Guid.Parse("0b1e0002-0000-4000-8000-000000000001"),
                Title = "Premium: Kalkülüs soru bankası (PDF)",
                Description = "Limit, türev ve integral konularında çözümlü soru bankası.",
                Provider = "Platform ödülü",
                Cost = 80,
                PerUserLimit = (int?)1,
                IsActive = true,
                SortOrder = 1,
                CreatedAtUtc = seeded
            },
            new
            {
                Id = Guid.Parse("0b1e0002-0000-4000-8000-000000000002"),
                Title = "Premium: Mentörle 15 dk soru-cevap",
                Description = "Üniversiteli bir mentörle 15 dakikalık birebir görüşme.",
                Provider = "Üniversiteli mentor",
                Cost = 150,
                StockRemaining = (int?)10,
                PerUserLimit = (int?)2,
                IsActive = true,
                SortOrder = 2,
                CreatedAtUtc = seeded
            },
            new
            {
                Id = Guid.Parse("0b1e0002-0000-4000-8000-000000000003"),
                Title = "Premium: Fizik 1 formül kitapçığı",
                Description = "Fizik 1 için tek sayfalık formül ve birim özetleri.",
                Provider = "Platform ödülü",
                Cost = 70,
                PerUserLimit = (int?)1,
                IsActive = true,
                SortOrder = 3,
                CreatedAtUtc = seeded
            },
            new
            {
                Id = Guid.Parse("0b1e0002-0000-4000-8000-000000000004"),
                Title = "Kitap kafe indirimi %15",
                Description = "Anlaşmalı kitap kafede geçerli %15 indirim kuponu.",
                Provider = "Örnek sponsor",
                Cost = 60,
                StockRemaining = (int?)50,
                PerUserLimit = (int?)1,
                IsActive = true,
                SortOrder = 4,
                CreatedAtUtc = seeded
            },
            new
            {
                Id = Guid.Parse("0b1e0002-0000-4000-8000-000000000005"),
                Title = "Reklamsız 1 hafta",
                Description = "Bir hafta boyunca reklamsız kullanım.",
                Provider = "Platform ödülü",
                Cost = 50,
                IsActive = true,
                SortOrder = 5,
                CreatedAtUtc = seeded
            });
    }
}