using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class IdempotencyKeyConfiguration : IEntityTypeConfiguration<IdempotencyKey>
{
    public void Configure(EntityTypeBuilder<IdempotencyKey> b)
    {
        b.ToTable("IdempotencyKeys");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();

        // BIN2: anahtar büyük/küçük harf duyarlı karşılaştırılır (DB collation'ı CI olsa bile).
        b.Property(x => x.Key).HasMaxLength(64).IsUnicode(false).UseCollation("Latin1_General_100_BIN2").IsRequired();
        b.Property(x => x.RequestHash).HasColumnType("binary(32)").IsRequired();
        b.Property(x => x.ContentType).HasMaxLength(100);
        b.Property(x => x.ResponseBody).HasColumnType("varbinary(max)");
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");

        // Eşzamanlı iki isteğin aynı anahtarla işlem yapmasını DB seviyesinde engelleyen asıl garanti.
        b.HasIndex(x => new { x.UserId, x.Key }).IsUnique().HasDatabaseName("UX_IdempotencyKeys_UserId_Key");
        b.HasIndex(x => x.CreatedAtUtc).HasDatabaseName("IX_IdempotencyKeys_CreatedAtUtc"); // temizlik için

        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}