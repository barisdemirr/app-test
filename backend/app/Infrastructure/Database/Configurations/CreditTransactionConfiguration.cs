using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class CreditTransactionConfiguration : IEntityTypeConfiguration<CreditTransaction>
{
    public void Configure(EntityTypeBuilder<CreditTransaction> b)
    {
        b.ToTable("CreditTransactions", t =>
            t.HasCheckConstraint("CK_CreditTransactions_BalanceAfter_NonNegative", "[BalanceAfter] >= 0"));

        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Reason).HasConversion<byte>().HasColumnType("tinyint");
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");

        // Aynı sebep + aynı referans için ikinci kredi hareketi DB seviyesinde imkansız.
        b.HasIndex(x => new { x.UserId, x.Reason, x.RefId })
            .IsUnique().HasDatabaseName("UX_CreditTransactions_UserId_Reason_RefId");

        // Geçmiş listesi için
        b.HasIndex(x => new { x.UserId, x.CreatedAtUtc }).HasDatabaseName("IX_CreditTransactions_UserId_CreatedAtUtc");

        // Restrict: kullanıcı silinse bile finansal kayıt otomatik yok olmasın.
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}