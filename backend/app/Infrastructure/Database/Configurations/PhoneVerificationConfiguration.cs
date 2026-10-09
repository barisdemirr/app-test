using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class PhoneVerificationConfiguration : IEntityTypeConfiguration<PhoneVerification>
{
    public void Configure(EntityTypeBuilder<PhoneVerification> b)
    {
        b.ToTable("PhoneVerifications", t => t.HasCheckConstraint("CK_PhoneVerifications_Attempts", "[Attempts] >= 0"));
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Phone).HasMaxLength(13).IsUnicode(false).IsRequired();
        b.Property(x => x.CodeHash).HasColumnType("binary(32)").IsRequired();
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.ExpiresAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.ConsumedAtUtc).HasColumnType("datetime2(3)");

        // Bir numara için aynı anda tek aktif kod: paralel iki kod isteği birbirini ezemez.
        b.HasIndex(x => x.Phone).IsUnique().HasFilter("[ConsumedAtUtc] IS NULL").HasDatabaseName("UX_PhoneVerifications_ActivePerPhone");
        b.HasIndex(x => new { x.Phone, x.CreatedAtUtc }).HasDatabaseName("IX_PhoneVerifications_Phone_CreatedAtUtc");
        b.HasIndex(x => x.CreatedAtUtc).HasDatabaseName("IX_PhoneVerifications_CreatedAtUtc"); // temizlik için
    }
}