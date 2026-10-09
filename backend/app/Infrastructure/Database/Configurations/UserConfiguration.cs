using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.ToTable("Users", t =>
        {
            // Son savunma hattı: uygulama hata yapsa bile DB eksi bakiyeyi reddeder.
            t.HasCheckConstraint("CK_Users_CreditBalance_NonNegative", "[CreditBalance] >= 0");
            t.HasCheckConstraint("CK_Users_DailyEarned_NonNegative", "[DailyEarned] >= 0");
            t.HasCheckConstraint("CK_Users_InvitesUsed_NonNegative", "[InvitesUsed] >= 0");
            t.HasCheckConstraint("CK_Users_NotSelfInvited", "[InvitedByUserId] IS NULL OR [InvitedByUserId] <> [Id]");
        });

        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();

        b.Property(x => x.Phone).HasMaxLength(13).IsUnicode(false).IsRequired();
        b.Property(x => x.DisplayName).HasMaxLength(40).IsRequired();
        b.Property(x => x.PasswordHash).HasMaxLength(256).IsRequired();
        b.Property(x => x.About).HasMaxLength(500).IsRequired().HasDefaultValue("");
        b.Property(x => x.AvatarPath).HasMaxLength(100).IsUnicode(false);
        b.Property(x => x.AvatarUpdatedAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.InviteCode).HasMaxLength(8).IsUnicode(false).IsFixedLength()
            .UseCollation("Latin1_General_100_BIN2").IsRequired();

        b.Property(x => x.CreditBalance).HasDefaultValue(0);
        b.Property(x => x.DailyEarned).HasDefaultValue(0);
        b.Property(x => x.DailyEarnedDay).HasColumnType("date");
        b.Property(x => x.InvitesUsed).HasDefaultValue(0);
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.LockoutEndUtc).HasColumnType("datetime2(3)");

        // Bir telefon, bir hesap: iki eşzamanlı kayıt aynı numarayı alamaz.
        b.HasIndex(x => x.Phone).IsUnique().HasDatabaseName("UX_Users_Phone");
        b.HasIndex(x => x.InviteCode).IsUnique().HasDatabaseName("UX_Users_InviteCode");
        b.HasIndex(x => x.InvitedByUserId).HasFilter("[InvitedByUserId] IS NOT NULL").HasDatabaseName("IX_Users_InvitedByUserId");

        b.HasOne<User>().WithMany().HasForeignKey(x => x.InvitedByUserId).OnDelete(DeleteBehavior.Restrict);
    }
}