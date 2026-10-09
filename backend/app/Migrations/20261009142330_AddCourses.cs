using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace app.Migrations
{
    /// <inheritdoc />
    public partial class AddCourses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Courses");
        }
    }
}
