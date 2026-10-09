using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace app.Migrations
{
    /// <inheritdoc />
    public partial class AddQaRefund : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RefundedAtUtc",
                table: "QaQuestions",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_QaQuestions_PendingRefund",
                table: "QaQuestions",
                column: "CreatedAtUtc",
                filter: "[AnswerCount] = 0 AND [RefundedAtUtc] IS NULL AND [Mode] = 1");

            migrationBuilder.AddCheckConstraint(
                name: "CK_QaQuestions_RefundExclusive",
                table: "QaQuestions",
                sql: "[RefundedAtUtc] IS NULL OR ([BestAnswerId] IS NULL AND [AnswerCount] = 0)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_QaQuestions_PendingRefund",
                table: "QaQuestions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_QaQuestions_RefundExclusive",
                table: "QaQuestions");

            migrationBuilder.DropColumn(
                name: "RefundedAtUtc",
                table: "QaQuestions");
        }
    }
}
