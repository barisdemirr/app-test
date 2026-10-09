using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        // Son savunma hattı: uygulama hata yapsa bile DB eksi bakiyeyi reddeder.
        b.ToTable("Users", t =>
{
    t.HasCheckConstraint("CK_Users_CreditBalance_NonNegative", "[CreditBalance] >= 0");
    t.HasCheckConstraint("CK_Users_DailyEarned_NonNegative", "[DailyEarned] >= 0");
});

        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();

        b.Property(x => x.Email).HasMaxLength(254).IsRequired();
        b.Property(x => x.NormalizedEmail).HasMaxLength(254).IsRequired();
        b.Property(x => x.DisplayName).HasMaxLength(40).IsRequired();
        b.Property(x => x.PasswordHash).HasMaxLength(256).IsRequired();
        b.Property(x => x.CreditBalance).HasDefaultValue(0);
        b.Property(x => x.DailyEarned).HasDefaultValue(0);
        b.Property(x => x.DailyEarnedDay).HasColumnType("date");
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.LockoutEndUtc).HasColumnType("datetime2(3)");

        // Kayıt yarışının asıl çözümü: iki eşzamanlı kayıt aynı e-postayı alamaz.
        b.HasIndex(x => x.NormalizedEmail).IsUnique().HasDatabaseName("UX_Users_NormalizedEmail");
    }
}