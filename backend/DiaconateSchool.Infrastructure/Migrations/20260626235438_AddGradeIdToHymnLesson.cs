using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGradeIdToHymnLesson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GradeId",
                table: "HymnLessons",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_HymnLessons_GradeId",
                table: "HymnLessons",
                column: "GradeId");

            migrationBuilder.AddForeignKey(
                name: "FK_HymnLessons_Grades_GradeId",
                table: "HymnLessons",
                column: "GradeId",
                principalTable: "Grades",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HymnLessons_Grades_GradeId",
                table: "HymnLessons");

            migrationBuilder.DropIndex(
                name: "IX_HymnLessons_GradeId",
                table: "HymnLessons");

            migrationBuilder.DropColumn(
                name: "GradeId",
                table: "HymnLessons");
        }
    }
}
