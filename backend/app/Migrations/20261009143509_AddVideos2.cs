using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace app.Migrations
{
    /// <inheritdoc />
    public partial class AddVideos2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VideoOptions_QuestionId",
                table: "VideoOptions");

            migrationBuilder.AlterColumn<string>(
                name: "Text",
                table: "VideoOptions",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "VideoOptions",
                type: "datetime2(3)",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.CreateIndex(
                name: "UX_VideoOptions_OneCorrectPerQuestion",
                table: "VideoOptions",
                column: "QuestionId",
                unique: true,
                filter: "[IsCorrect] = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_VideoOptions_OneCorrectPerQuestion",
                table: "VideoOptions");

            migrationBuilder.AlterColumn<string>(
                name: "Text",
                table: "VideoOptions",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "VideoOptions",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2(3)");

            migrationBuilder.CreateIndex(
                name: "IX_VideoOptions_QuestionId",
                table: "VideoOptions",
                column: "QuestionId");
        }
    }
}
