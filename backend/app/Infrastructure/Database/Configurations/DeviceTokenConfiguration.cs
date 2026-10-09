using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class DeviceTokenConfiguration : IEntityTypeConfiguration<DeviceToken>
{
    public void Configure(EntityTypeBuilder<DeviceToken> b)
    {
        b.ToTable("DeviceTokens");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Token).HasMaxLength(255).IsUnicode(false).IsRequired();
        b.Property(x => x.Platform).HasMaxLength(10).IsUnicode(false).IsRequired();
        b.Property(x => x.Provider).HasConversion<byte>().HasColumnType("tinyint");
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.LastSeenAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.DisabledAtUtc).HasColumnType("datetime2(3)");

        // Bir cihaz token'ı tek hesaba bağlıdır.
        b.HasIndex(x => x.Token).IsUnique().HasDatabaseName("UX_DeviceTokens_Token");
        b.HasIndex(x => new { x.UserId, x.DisabledAtUtc }).HasDatabaseName("IX_DeviceTokens_UserId_DisabledAtUtc");

        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}