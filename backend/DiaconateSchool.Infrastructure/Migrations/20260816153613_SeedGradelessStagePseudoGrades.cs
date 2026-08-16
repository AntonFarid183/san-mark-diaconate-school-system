using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedGradelessStagePseudoGrades : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Grades",
                columns: new[] { "Id", "AcademicYearId", "Level", "Name", "StageId" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000011"), null, 1, "KG1", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("00000000-0000-0000-0000-000000000012"), null, 2, "KG2", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("00000000-0000-0000-0004-000000000011"), null, 1, "جامعة", new Guid("00000000-0000-0000-0004-000000000001") },
                    { new Guid("00000000-0000-0000-0005-000000000011"), null, 1, "خريجون", new Guid("00000000-0000-0000-0005-000000000001") },
                    { new Guid("00000000-0000-0000-0006-000000000011"), null, 1, "كبار", new Guid("00000000-0000-0000-0006-000000000001") }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Grades",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000011"));

            migrationBuilder.DeleteData(
                table: "Grades",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000012"));

            migrationBuilder.DeleteData(
                table: "Grades",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0004-000000000011"));

            migrationBuilder.DeleteData(
                table: "Grades",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0005-000000000011"));

            migrationBuilder.DeleteData(
                table: "Grades",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0006-000000000011"));
        }
    }
}
