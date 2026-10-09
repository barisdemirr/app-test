using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class RewardRedemptionConfiguration : IEntityTypeConfiguration<RewardRedemption>
{
    public void Configure(EntityTypeBuilder<RewardRedemption> b)
    {
        b.ToTable("RewardRedemptions", t => t.HasCheckConstraint("CK_RewardRedemptions_Cost", "[Cost] > 0"));
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Code).HasMaxLength(12).IsUnicode(false).IsFixedLength()
            .UseCollation("Latin1_General_100_BIN2").IsRequired();
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");

        b.HasIndex(x => x.Code).IsUnique().HasDatabaseName("UX_RewardRedemptions_Code");
        b.HasIndex(x => new { x.UserId, x.CreatedAtUtc }).HasDatabaseName("IX_RewardRedemptions_UserId_CreatedAtUtc"); // günlük sayım ve geçmiş
        b.HasIndex(x => new { x.UserId, x.RewardId }).HasDatabaseName("IX_RewardRedemptions_UserId_RewardId");         // ödül başına sayım

        // Restrict: finansal kayıtlar zincirleme silinmesin.
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Reward>().WithMany().HasForeignKey(x => x.RewardId).OnDelete(DeleteBehavior.Restrict);
    }
}