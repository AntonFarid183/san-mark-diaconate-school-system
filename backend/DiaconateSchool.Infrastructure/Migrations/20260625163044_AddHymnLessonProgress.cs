using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHymnLessonProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HymnLessonProgresses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StudentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HymnLessonId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MaxReachedPosition = table.Column<int>(type: "int", nullable: false),
                    LastPosition = table.Column<int>(type: "int", nullable: false),
                    TotalDuration = table.Column<int>(type: "int", nullable: false),
                    WatchedPercent = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FirstViewedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastViewedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HymnLessonProgresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HymnLessonProgresses_HymnLessons_HymnLessonId",
                        column: x => x.HymnLessonId,
                        principalTable: "HymnLessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HymnLessonProgresses_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HymnLessonProgresses_HymnLessonId",
                table: "HymnLessonProgresses",
                column: "HymnLessonId");

            migrationBuilder.CreateIndex(
                name: "IX_HymnLessonProgresses_StudentId_HymnLessonId",
                table: "HymnLessonProgresses",
                columns: new[] { "StudentId", "HymnLessonId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HymnLessonProgresses");
        }
    }
}
