using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentLevels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SchoolClasses_GradeId_AcademicYearId_Name",
                table: "SchoolClasses");

            migrationBuilder.AddColumn<int>(
                name: "Level",
                table: "Students",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "Level",
                table: "SchoolClasses",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_SchoolClasses_GradeId_AcademicYearId_Level_Name",
                table: "SchoolClasses",
                columns: new[] { "GradeId", "AcademicYearId", "Level", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SchoolClasses_GradeId_AcademicYearId_Level_Name",
                table: "SchoolClasses");

            migrationBuilder.DropColumn(
                name: "Level",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "Level",
                table: "SchoolClasses");

            migrationBuilder.CreateIndex(
                name: "IX_SchoolClasses_GradeId_AcademicYearId_Name",
                table: "SchoolClasses",
                columns: new[] { "GradeId", "AcademicYearId", "Name" },
                unique: true);
        }
    }
}
