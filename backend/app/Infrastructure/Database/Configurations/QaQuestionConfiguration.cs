using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class QaQuestionConfiguration : IEntityTypeConfiguration<QaQuestion>
{
    public void Configure(EntityTypeBuilder<QaQuestion> b)
    {
        b.ToTable("QaQuestions", t =>
        {
            t.HasCheckConstraint("CK_QaQuestions_AnswerCount", "[AnswerCount] >= 0");
            // Ödül her zaman fiyattan küçük: kredi basma döngüsü DB seviyesinde imkansız.
            t.HasCheckConstraint("CK_QaQuestions_RewardBelowCost", "[Reward] > 0 AND [Reward] < [Cost]");
            // En iyi cevap bilgisi ya tamamen dolu ya tamamen boş.
            t.HasCheckConstraint("CK_QaQuestions_BestConsistent",
                "([BestAnswerId] IS NULL AND [BestChosenAtUtc] IS NULL AND [BestChosenBy] IS NULL) OR " +
                "([BestAnswerId] IS NOT NULL AND [BestChosenAtUtc] IS NOT NULL AND [BestChosenBy] IS NOT NULL)");
        });

        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Category).HasMaxLength(40).IsRequired();
        b.Property(x => x.Topic).HasMaxLength(40).IsRequired();
        b.Property(x => x.Text).HasMaxLength(500).IsRequired();
        b.Property(x => x.Mode).HasConversion<byte>().HasColumnType("tinyint");
        b.Property(x => x.BestChosenBy).HasConversion<byte>().HasColumnType("tinyint");
        b.Property(x => x.AnswerCount).HasDefaultValue(0);
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.FirstAnswerAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.BestChosenAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.Seq).ValueGeneratedOnAdd().HasDefaultValueSql("NEXT VALUE FOR dbo.QaQuestionSeq");

        // Liste: Seq'e göre azalan tarama, filtre sütunları indekse dahil.
        b.HasIndex(x => x.Seq).IsUnique().IsDescending()
            .IncludeProperties(x => new { x.Category, x.Mode })
            .HasDatabaseName("UX_QaQuestions_Seq");

        // Otomatik ödül servisi yalnızca "seçilmemiş ve cevabı olan" sorulara bakar.
        b.HasIndex(x => x.FirstAnswerAtUtc)
            .HasFilter("[BestAnswerId] IS NULL AND [FirstAnswerAtUtc] IS NOT NULL")
            .HasDatabaseName("IX_QaQuestions_PendingAward");

        b.HasIndex(x => new { x.AuthorId, x.Seq }).HasDatabaseName("IX_QaQuestions_AuthorId_Seq");

        b.HasOne<User>().WithMany().HasForeignKey(x => x.AuthorId).OnDelete(DeleteBehavior.Restrict);
    }
}