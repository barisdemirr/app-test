using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace app.Migrations
{
    /// <inheritdoc />
    public partial class AddLiveAndNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DeviceTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Token = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    Platform = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    Provider = table.Column<byte>(type: "tinyint", nullable: false),
                    LastSeenAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false),
                    DisabledAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeviceTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LiveSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Kind = table.Column<byte>(type: "tinyint", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    Outcome = table.Column<byte>(type: "tinyint", nullable: false),
                    HostId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GuestId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CourseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Price = table.Column<int>(type: "int", nullable: false),
                    Payout = table.Column<int>(type: "int", nullable: false),
                    EscrowCredits = table.Column<int>(type: "int", nullable: false),
                    ScheduledAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    DurationMinutes = table.Column<int>(type: "int", nullable: true),
                    JoinDeadlineUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    ApprovalDeadlineUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    HostJoinedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    GuestJoinedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    LiveStartedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    EndedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    SettledAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    DueAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LiveSessions", x => x.Id);
                    table.CheckConstraint("CK_LiveSessions_Escrow", "[EscrowCredits] >= 0 AND [EscrowCredits] <= [Price]");
                    table.CheckConstraint("CK_LiveSessions_Kind", "[Kind] IN (1, 2)");
                    table.CheckConstraint("CK_LiveSessions_LessonFields", "[Kind] = 1 OR ([ScheduledAtUtc] IS NOT NULL AND [DurationMinutes] IS NOT NULL)");
                    table.CheckConstraint("CK_LiveSessions_NotSelf", "[GuestId] IS NULL OR [GuestId] <> [HostId]");
                    table.CheckConstraint("CK_LiveSessions_Outcome", "[Outcome] BETWEEN 0 AND 7");
                    table.CheckConstraint("CK_LiveSessions_Payout", "[Payout] >= 0 AND [Payout] <= [Price]");
                    table.CheckConstraint("CK_LiveSessions_Price", "[Price] > 0");
                    table.CheckConstraint("CK_LiveSessions_Status", "[Status] BETWEEN 1 AND 10");
                    table.ForeignKey(
                        name: "FK_LiveSessions_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LiveSessions_Users_GuestId",
                        column: x => x.GuestId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LiveSessions_Users_HostId",
                        column: x => x.HostId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<byte>(type: "tinyint", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Body = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    DataJson = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    TtlSeconds = table.Column<int>(type: "int", nullable: true),
                    ReadAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Delivery = table.Column<byte>(type: "tinyint", nullable: false),
                    PushAttempts = table.Column<int>(type: "int", nullable: false),
                    NextPushAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    PushedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    LastError = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.CheckConstraint("CK_Notifications_Delivery", "[Delivery] BETWEEN 0 AND 4");
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeviceTokens_UserId_DisabledAtUtc",
                table: "DeviceTokens",
                columns: new[] { "UserId", "DisabledAtUtc" });

            migrationBuilder.CreateIndex(
                name: "UX_DeviceTokens_Token",
                table: "DeviceTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LiveSessions_CourseId_Kind_Status",
                table: "LiveSessions",
                columns: new[] { "CourseId", "Kind", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_LiveSessions_DueAtUtc",
                table: "LiveSessions",
                column: "DueAtUtc",
                filter: "[DueAtUtc] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_LiveSessions_GuestId_CreatedAtUtc",
                table: "LiveSessions",
                columns: new[] { "GuestId", "CreatedAtUtc" },
                filter: "[GuestId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_LiveSessions_HostId_CreatedAtUtc",
                table: "LiveSessions",
                columns: new[] { "HostId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_LiveSessions_Kind_Status_CreatedAtUtc",
                table: "LiveSessions",
                columns: new[] { "Kind", "Status", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "UX_LiveSessions_Guest_Active",
                table: "LiveSessions",
                column: "GuestId",
                unique: true,
                filter: "[GuestId] IS NOT NULL AND [Status] >= 4 AND [Status] <= 6");

            migrationBuilder.CreateIndex(
                name: "UX_LiveSessions_Host_Active",
                table: "LiveSessions",
                column: "HostId",
                unique: true,
                filter: "[Status] >= 4 AND [Status] <= 6");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_Pending",
                table: "Notifications",
                column: "NextPushAtUtc",
                filter: "[Delivery] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_CreatedAtUtc",
                table: "Notifications",
                columns: new[] { "UserId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_Unread",
                table: "Notifications",
                column: "UserId",
                filter: "[ReadAtUtc] IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeviceTokens");

            migrationBuilder.DropTable(
                name: "LiveSessions");

            migrationBuilder.DropTable(
                name: "Notifications");
        }
    }
}
