using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace app.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence(
                name: "QaQuestionSeq");

            migrationBuilder.CreateSequence(
                name: "VideoPublishSeq");

            migrationBuilder.CreateTable(
                name: "Courses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Courses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PhoneVerifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Phone = table.Column<string>(type: "varchar(13)", unicode: false, maxLength: 13, nullable: false),
                    CodeHash = table.Column<byte[]>(type: "binary(32)", nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false),
                    Attempts = table.Column<int>(type: "int", nullable: false),
                    ConsumedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhoneVerifications", x => x.Id);
                    table.CheckConstraint("CK_PhoneVerifications_Attempts", "[Attempts] >= 0");
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Phone = table.Column<string>(type: "varchar(13)", unicode: false, maxLength: 13, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CreditBalance = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    DailyEarned = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    DailyEarnedDay = table.Column<DateOnly>(type: "date", nullable: true),
                    InviteCode = table.Column<string>(type: "char(8)", unicode: false, fixedLength: true, maxLength: 8, nullable: false, collation: "Latin1_General_100_BIN2"),
                    InvitedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    InvitesUsed = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    FailedLoginCount = table.Column<int>(type: "int", nullable: false),
                    LockoutEndUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.CheckConstraint("CK_Users_CreditBalance_NonNegative", "[CreditBalance] >= 0");
                    table.CheckConstraint("CK_Users_DailyEarned_NonNegative", "[DailyEarned] >= 0");
                    table.CheckConstraint("CK_Users_InvitesUsed_NonNegative", "[InvitesUsed] >= 0");
                    table.CheckConstraint("CK_Users_NotSelfInvited", "[InvitedByUserId] IS NULL OR [InvitedByUserId] <> [Id]");
                    table.ForeignKey(
                        name: "FK_Users_Users_InvitedByUserId",
                        column: x => x.InvitedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CreditTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<int>(type: "int", nullable: false),
                    BalanceAfter = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<byte>(type: "tinyint", nullable: false),
                    RefId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CreditTransactions", x => x.Id);
                    table.CheckConstraint("CK_CreditTransactions_BalanceAfter_NonNegative", "[BalanceAfter] >= 0");
                    table.ForeignKey(
                        name: "FK_CreditTransactions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "IdempotencyKeys",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Key = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: false, collation: "Latin1_General_100_BIN2"),
                    RequestHash = table.Column<byte[]>(type: "binary(32)", nullable: false),
                    StatusCode = table.Column<int>(type: "int", nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ResponseBody = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IdempotencyKeys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IdempotencyKeys_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                    RefundedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Seq = table.Column<long>(type: "bigint", nullable: false, defaultValueSql: "NEXT VALUE FOR dbo.QaQuestionSeq"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QaQuestions", x => x.Id);
                    table.CheckConstraint("CK_QaQuestions_AnswerCount", "[AnswerCount] >= 0");
                    table.CheckConstraint("CK_QaQuestions_BestConsistent", "([BestAnswerId] IS NULL AND [BestChosenAtUtc] IS NULL AND [BestChosenBy] IS NULL) OR ([BestAnswerId] IS NOT NULL AND [BestChosenAtUtc] IS NOT NULL AND [BestChosenBy] IS NOT NULL)");
                    table.CheckConstraint("CK_QaQuestions_RefundExclusive", "[RefundedAtUtc] IS NULL OR ([BestAnswerId] IS NULL AND [AnswerCount] = 0)");
                    table.CheckConstraint("CK_QaQuestions_RewardBelowCost", "[Reward] > 0 AND [Reward] < [Cost]");
                    table.ForeignKey(
                        name: "FK_QaQuestions_Users_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Videos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CourseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(70)", maxLength: 70, nullable: false),
                    Topic = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    DurationMs = table.Column<int>(type: "int", nullable: true),
                    StoragePath = table.Column<string>(type: "varchar(200)", unicode: false, maxLength: 200, nullable: true),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: true),
                    PublishedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    PublishSeq = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Videos", x => x.Id);
                    table.CheckConstraint("CK_Videos_Published_Complete", "[Status] <> 2 OR ([DurationMs] > 0 AND [StoragePath] IS NOT NULL AND [PublishSeq] IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_Videos_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Videos_Users_CreatorId",
                        column: x => x.CreatorId,
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

            migrationBuilder.CreateTable(
                name: "VideoQuestions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VideoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Position = table.Column<byte>(type: "tinyint", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Explanation = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoQuestions", x => x.Id);
                    table.CheckConstraint("CK_VideoQuestions_Position", "[Position] IN (1, 2)");
                    table.ForeignKey(
                        name: "FK_VideoQuestions_Videos_VideoId",
                        column: x => x.VideoId,
                        principalTable: "Videos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WatchSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VideoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VideoDurationMs = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    WatchedMs = table.Column<int>(type: "int", nullable: false),
                    LastPositionMs = table.Column<int>(type: "int", nullable: false),
                    LastHeartbeatAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WatchSessions", x => x.Id);
                    table.CheckConstraint("CK_WatchSessions_Progress", "[WatchedMs] >= 0 AND [WatchedMs] <= [VideoDurationMs] AND [LastPositionMs] >= 0 AND [LastPositionMs] <= [VideoDurationMs]");
                    table.ForeignKey(
                        name: "FK_WatchSessions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WatchSessions_Videos_VideoId",
                        column: x => x.VideoId,
                        principalTable: "Videos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VideoOptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VideoOptions_VideoQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "VideoQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuizAttempts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VideoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SelectedOptionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: false),
                    CreditAwarded = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizAttempts", x => x.Id);
                    table.CheckConstraint("CK_QuizAttempts_Credit", "[CreditAwarded] >= 0 AND ([IsCorrect] = 1 OR [CreditAwarded] = 0)");
                    table.ForeignKey(
                        name: "FK_QuizAttempts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuizAttempts_VideoOptions_SelectedOptionId",
                        column: x => x.SelectedOptionId,
                        principalTable: "VideoOptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuizAttempts_VideoQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "VideoQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuizAttempts_Videos_VideoId",
                        column: x => x.VideoId,
                        principalTable: "Videos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Courses",
                columns: new[] { "Id", "CreatedAtUtc", "Name", "Slug", "SortOrder" },
                values: new object[,]
                {
                    { new Guid("0b1e0001-0000-4000-8000-000000000001"), new DateTime(2026, 10, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Matematik 1", "matematik-1", 1 },
                    { new Guid("0b1e0001-0000-4000-8000-000000000002"), new DateTime(2026, 10, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Fizik 1", "fizik-1", 2 },
                    { new Guid("0b1e0001-0000-4000-8000-000000000003"), new DateTime(2026, 10, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Genel Kimya", "genel-kimya", 3 },
                    { new Guid("0b1e0001-0000-4000-8000-000000000004"), new DateTime(2026, 10, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Anatomi", "anatomi", 4 },
                    { new Guid("0b1e0001-0000-4000-8000-000000000005"), new DateTime(2026, 10, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Hücre Biyolojisi", "hucre-biyolojisi", 5 }
                });

            migrationBuilder.CreateIndex(
                name: "UX_Courses_Slug",
                table: "Courses",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CreditTransactions_UserId_CreatedAtUtc",
                table: "CreditTransactions",
                columns: new[] { "UserId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "UX_CreditTransactions_UserId_Reason_RefId",
                table: "CreditTransactions",
                columns: new[] { "UserId", "Reason", "RefId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_IdempotencyKeys_CreatedAtUtc",
                table: "IdempotencyKeys",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "UX_IdempotencyKeys_UserId_Key",
                table: "IdempotencyKeys",
                columns: new[] { "UserId", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PhoneVerifications_CreatedAtUtc",
                table: "PhoneVerifications",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_PhoneVerifications_Phone_CreatedAtUtc",
                table: "PhoneVerifications",
                columns: new[] { "Phone", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "UX_PhoneVerifications_ActivePerPhone",
                table: "PhoneVerifications",
                column: "Phone",
                unique: true,
                filter: "[ConsumedAtUtc] IS NULL");

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
                name: "IX_QaQuestions_PendingRefund",
                table: "QaQuestions",
                column: "CreatedAtUtc",
                filter: "[AnswerCount] = 0 AND [RefundedAtUtc] IS NULL AND [Mode] = 1");

            migrationBuilder.CreateIndex(
                name: "UX_QaQuestions_Seq",
                table: "QaQuestions",
                column: "Seq",
                unique: true,
                descending: new bool[0])
                .Annotation("SqlServer:Include", new[] { "Category", "Mode" });

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_QuestionId",
                table: "QuizAttempts",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_SelectedOptionId",
                table: "QuizAttempts",
                column: "SelectedOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_UserId_VideoId",
                table: "QuizAttempts",
                columns: new[] { "UserId", "VideoId" });

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_VideoId",
                table: "QuizAttempts",
                column: "VideoId");

            migrationBuilder.CreateIndex(
                name: "UX_QuizAttempts_UserId_QuestionId",
                table: "QuizAttempts",
                columns: new[] { "UserId", "QuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_InvitedByUserId",
                table: "Users",
                column: "InvitedByUserId",
                filter: "[InvitedByUserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_Users_InviteCode",
                table: "Users",
                column: "InviteCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_Users_Phone",
                table: "Users",
                column: "Phone",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_VideoOptions_OneCorrectPerQuestion",
                table: "VideoOptions",
                column: "QuestionId",
                unique: true,
                filter: "[IsCorrect] = 1");

            migrationBuilder.CreateIndex(
                name: "UX_VideoQuestions_VideoId_Position",
                table: "VideoQuestions",
                columns: new[] { "VideoId", "Position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Videos_CourseId",
                table: "Videos",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_Videos_CreatorId_CreatedAtUtc",
                table: "Videos",
                columns: new[] { "CreatorId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "UX_Videos_PublishSeq",
                table: "Videos",
                column: "PublishSeq",
                unique: true,
                descending: new bool[0],
                filter: "[PublishSeq] IS NOT NULL")
                .Annotation("SqlServer:Include", new[] { "Status", "CourseId" });

            migrationBuilder.CreateIndex(
                name: "IX_WatchSessions_Status_CreatedAtUtc",
                table: "WatchSessions",
                columns: new[] { "Status", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_WatchSessions_VideoId",
                table: "WatchSessions",
                column: "VideoId");

            migrationBuilder.CreateIndex(
                name: "UX_WatchSessions_OneActivePerUser",
                table: "WatchSessions",
                column: "UserId",
                unique: true,
                filter: "[Status] = 1");

            migrationBuilder.CreateIndex(
                name: "UX_WatchSessions_OneCompletedPerVideo",
                table: "WatchSessions",
                columns: new[] { "UserId", "VideoId" },
                unique: true,
                filter: "[Status] = 2");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CreditTransactions");

            migrationBuilder.DropTable(
                name: "IdempotencyKeys");

            migrationBuilder.DropTable(
                name: "PhoneVerifications");

            migrationBuilder.DropTable(
                name: "QaAnswers");

            migrationBuilder.DropTable(
                name: "QuizAttempts");

            migrationBuilder.DropTable(
                name: "WatchSessions");

            migrationBuilder.DropTable(
                name: "QaQuestions");

            migrationBuilder.DropTable(
                name: "VideoOptions");

            migrationBuilder.DropTable(
                name: "VideoQuestions");

            migrationBuilder.DropTable(
                name: "Videos");

            migrationBuilder.DropTable(
                name: "Courses");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropSequence(
                name: "QaQuestionSeq");

            migrationBuilder.DropSequence(
                name: "VideoPublishSeq");
        }
    }
}
