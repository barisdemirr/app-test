using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace app.Migrations
{
    /// <inheritdoc />
    public partial class AddQa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence(
                name: "QaQuestionSeq");

            migrationBuilder.CreateTable(
                name: "QaQuestions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuthorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Topic = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Text = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Mode = table.Column<byte>(type: "tinyint", nullable: false),
                    Cost = table.Column<int>(type: "int", nullable: false),
                    Reward = table.Column<int>(type: "int", nullable: false),
                    AnswerCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    FirstAnswerAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    BestAnswerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    BestChosenAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    BestChosenBy = table.Column<byte>(type: "tinyint", nullable: true),
                    Seq = table.Column<long>(type: "bigint", nullable: false, defaultValueSql: "NEXT VALUE FOR dbo.QaQuestionSeq"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QaQuestions", x => x.Id);
                    table.CheckConstraint("CK_QaQuestions_AnswerCount", "[AnswerCount] >= 0");
                    table.CheckConstraint("CK_QaQuestions_BestConsistent", "([BestAnswerId] IS NULL AND [BestChosenAtUtc] IS NULL AND [BestChosenBy] IS NULL) OR ([BestAnswerId] IS NOT NULL AND [BestChosenAtUtc] IS NOT NULL AND [BestChosenBy] IS NOT NULL)");
                    table.CheckConstraint("CK_QaQuestions_RewardBelowCost", "[Reward] > 0 AND [Reward] < [Cost]");
                    table.ForeignKey(
                        name: "FK_QaQuestions_Users_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QaAnswers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuthorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    EditedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QaAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QaAnswers_QaQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "QaQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QaAnswers_Users_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QaAnswers_AuthorId_CreatedAtUtc",
                table: "QaAnswers",
                columns: new[] { "AuthorId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_QaAnswers_QuestionId_CreatedAtUtc",
                table: "QaAnswers",
                columns: new[] { "QuestionId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "UX_QaAnswers_QuestionId_AuthorId",
                table: "QaAnswers",
                columns: new[] { "QuestionId", "AuthorId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QaQuestions_AuthorId_Seq",
                table: "QaQuestions",
                columns: new[] { "AuthorId", "Seq" });

            migrationBuilder.CreateIndex(
                name: "IX_QaQuestions_PendingAward",
                table: "QaQuestions",
                column: "FirstAnswerAtUtc",
                filter: "[BestAnswerId] IS NULL AND [FirstAnswerAtUtc] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_QaQuestions_Seq",
                table: "QaQuestions",
                column: "Seq",
                unique: true,
                descending: new bool[0])
                .Annotation("SqlServer:Include", new[] { "Category", "Mode" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QaAnswers");

            migrationBuilder.DropTable(
                name: "QaQuestions");

            migrationBuilder.DropSequence(
                name: "QaQuestionSeq");
        }
    }
}
