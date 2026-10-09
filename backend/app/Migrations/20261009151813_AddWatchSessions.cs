using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace app.Migrations
{
    /// <inheritdoc />
    public partial class AddWatchSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                name: "WatchSessions");
        }
    }
}
