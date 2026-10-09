using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dersakis.Infrastructure.Database.Configurations;

public sealed class QaAnswerConfiguration : IEntityTypeConfiguration<QaAnswer>
{
    public void Configure(EntityTypeBuilder<QaAnswer> b)
    {
        b.ToTable("QaAnswers");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Text).HasMaxLength(1000).IsRequired();
        b.Property(x => x.CreatedAtUtc).HasColumnType("datetime2(3)");
        b.Property(x => x.EditedAtUtc).HasColumnType("datetime2(3)");

        // Bir kişi bir soruya yalnızca bir kez cevap verebilir.
        b.HasIndex(x => new { x.QuestionId, x.AuthorId }).IsUnique().HasDatabaseName("UX_QaAnswers_QuestionId_AuthorId");
        // "İlk cevaplayan" sorgusu ve cevap listesi için
        b.HasIndex(x => new { x.QuestionId, x.CreatedAtUtc }).HasDatabaseName("IX_QaAnswers_QuestionId_CreatedAtUtc");
        b.HasIndex(x => new { x.AuthorId, x.CreatedAtUtc }).HasDatabaseName("IX_QaAnswers_AuthorId_CreatedAtUtc");

        b.HasOne<QaQuestion>().WithMany().HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne<User>().WithMany().HasForeignKey(x => x.AuthorId).OnDelete(DeleteBehavior.Restrict);
    }
}