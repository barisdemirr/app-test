using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class QuizAttemptConfiguration : IEntityTypeConfiguration<QuizAttempt>
{
    public void Configure(EntityTypeBuilder<QuizAttempt> b)
    {
        // Yanlış cevaba kredi yazılması DB seviyesinde imkansız.
        b.ToTable("QuizAttempts", t => t.HasCheckConstraint("CK_QuizAttempts_Credit",
            "[CreditAwarded] >= 0 AND ([IsCorrect] = 1 OR [CreditAwarded] = 0)"));

        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");

        // Bir soru, bir kullanıcı için ömür boyu tek cevap.
        b.HasIndex(x => new { x.UserId, x.QuestionId }).IsUnique().HasDatabaseName("UX_QuizAttempts_UserId_QuestionId");
        // Profil istatistikleri ve feed sorguları için
        b.HasIndex(x => new { x.UserId, x.VideoId }).HasDatabaseName("IX_QuizAttempts_UserId_VideoId");

        // Hepsi Restrict: cevap kayıtları (finansal izle bağlantılı) zincirleme silinmesin.
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<VideoQuestion>().WithMany().HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<VideoOption>().WithMany().HasForeignKey(x => x.SelectedOptionId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Video>().WithMany().HasForeignKey(x => x.VideoId).OnDelete(DeleteBehavior.Restrict);
    }
}