using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGradeIdToCurriculum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GradeId",
                table: "Curriculums",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Curriculums_GradeId",
                table: "Curriculums",
                column: "GradeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Curriculums_Grades_GradeId",
                table: "Curriculums",
                column: "GradeId",
                principalTable: "Grades",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Curriculums_Grades_GradeId",
                table: "Curriculums");

            migrationBuilder.DropIndex(
                name: "IX_Curriculums_GradeId",
                table: "Curriculums");

            migrationBuilder.DropColumn(
                name: "GradeId",
                table: "Curriculums");
        }
    }
}
