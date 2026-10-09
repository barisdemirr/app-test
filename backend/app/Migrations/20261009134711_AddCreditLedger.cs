using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace app.Migrations
{
    /// <inheritdoc />
    public partial class AddCreditLedger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DailyEarned",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateOnly>(
                name: "DailyEarnedDay",
                table: "Users",
                type: "date",
                nullable: true);

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

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_DailyEarned_NonNegative",
                table: "Users",
                sql: "[DailyEarned] >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_CreditTransactions_UserId_CreatedAtUtc",
                table: "CreditTransactions",
                columns: new[] { "UserId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "UX_CreditTransactions_UserId_Reason_RefId",
                table: "CreditTransactions",
                columns: new[] { "UserId", "Reason", "RefId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CreditTransactions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_DailyEarned_NonNegative",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DailyEarned",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DailyEarnedDay",
                table: "Users");
        }
    }
}
