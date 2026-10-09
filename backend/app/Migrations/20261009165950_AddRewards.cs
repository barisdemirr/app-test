using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace app.Migrations
{
    /// <inheritdoc />
    public partial class AddRewards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Rewards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Provider = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    Cost = table.Column<int>(type: "int", nullable: false),
                    StockRemaining = table.Column<int>(type: "int", nullable: true),
                    PerUserLimit = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rewards", x => x.Id);
                    table.CheckConstraint("CK_Rewards_Cost", "[Cost] > 0");
                    table.CheckConstraint("CK_Rewards_PerUserLimit", "[PerUserLimit] IS NULL OR [PerUserLimit] > 0");
                    table.CheckConstraint("CK_Rewards_Stock", "[StockRemaining] IS NULL OR [StockRemaining] >= 0");
                });

            migrationBuilder.CreateTable(
                name: "RewardRedemptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RewardId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "char(12)", unicode: false, fixedLength: true, maxLength: 12, nullable: false, collation: "Latin1_General_100_BIN2"),
                    Cost = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RewardRedemptions", x => x.Id);
                    table.CheckConstraint("CK_RewardRedemptions_Cost", "[Cost] > 0");
                    table.ForeignKey(
                        name: "FK_RewardRedemptions_Rewards_RewardId",
                        column: x => x.RewardId,
                        principalTable: "Rewards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RewardRedemptions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Rewards",
                columns: new[] { "Id", "Cost", "CreatedAtUtc", "Description", "IsActive", "PerUserLimit", "Provider", "SortOrder", "StockRemaining", "Title" },
                values: new object[,]
                {
                    { new Guid("0b1e0002-0000-4000-8000-000000000001"), 80, new DateTime(2026, 10, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Limit, türev ve integral konularında çözümlü soru bankası.", true, 1, "Platform ödülü", 1, null, "Premium: Kalkülüs soru bankası (PDF)" },
                    { new Guid("0b1e0002-0000-4000-8000-000000000002"), 150, new DateTime(2026, 10, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Üniversiteli bir mentörle 15 dakikalık birebir görüşme.", true, 2, "Üniversiteli mentor", 2, 10, "Premium: Mentörle 15 dk soru-cevap" },
                    { new Guid("0b1e0002-0000-4000-8000-000000000003"), 70, new DateTime(2026, 10, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Fizik 1 için tek sayfalık formül ve birim özetleri.", true, 1, "Platform ödülü", 3, null, "Premium: Fizik 1 formül kitapçığı" },
                    { new Guid("0b1e0002-0000-4000-8000-000000000004"), 60, new DateTime(2026, 10, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Anlaşmalı kitap kafede geçerli %15 indirim kuponu.", true, 1, "Örnek sponsor", 4, 50, "Kitap kafe indirimi %15" },
                    { new Guid("0b1e0002-0000-4000-8000-000000000005"), 50, new DateTime(2026, 10, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Bir hafta boyunca reklamsız kullanım.", true, null, "Platform ödülü", 5, null, "Reklamsız 1 hafta" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_RewardRedemptions_RewardId",
                table: "RewardRedemptions",
                column: "RewardId");

            migrationBuilder.CreateIndex(
                name: "IX_RewardRedemptions_UserId_CreatedAtUtc",
                table: "RewardRedemptions",
                columns: new[] { "UserId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_RewardRedemptions_UserId_RewardId",
                table: "RewardRedemptions",
                columns: new[] { "UserId", "RewardId" });

            migrationBuilder.CreateIndex(
                name: "UX_RewardRedemptions_Code",
                table: "RewardRedemptions",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Rewards_IsActive_SortOrder",
                table: "Rewards",
                columns: new[] { "IsActive", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RewardRedemptions");

            migrationBuilder.DropTable(
                name: "Rewards");
        }
    }
}
