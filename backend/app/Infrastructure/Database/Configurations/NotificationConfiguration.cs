using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable("Notifications", t => t.HasCheckConstraint("CK_Notifications_Delivery", "[Delivery] BETWEEN 0 AND 4"));
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Type).HasConversion<byte>().HasColumnType("tinyint");
        b.Property(x => x.Delivery).HasConversion<byte>().HasColumnType("tinyint");
        b.Property(x => x.Title).HasMaxLength(80).IsRequired();
        b.Property(x => x.Body).HasMaxLength(300).IsRequired();
        b.Property(x => x.DataJson).HasMaxLength(500);
        b.Property(x => x.LastError).HasMaxLength(200);
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.ReadAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.NextPushAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.PushedAtUtc).HasColumnType("datetime2(3)");

        b.HasIndex(x => new { x.UserId, x.CreatedAtUtc }).HasDatabaseName("IX_Notifications_UserId_CreatedAtUtc");
        b.HasIndex(x => x.UserId).HasFilter("[ReadAtUtc] IS NULL").HasDatabaseName("IX_Notifications_UserId_Unread");
        // Dispatcher yalnızca bekleyenlere bakar (Delivery = 0)
        b.HasIndex(x => x.NextPushAtUtc).HasFilter("[Delivery] = 0").HasDatabaseName("IX_Notifications_Pending");

        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}