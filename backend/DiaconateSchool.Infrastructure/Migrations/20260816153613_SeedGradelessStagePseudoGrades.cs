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
            // Guarded with IF NOT EXISTS: some databases already had these
            // pseudo-grade rows seeded outside this migration (e.g. manual
            // seed runs), so a plain InsertData throws a duplicate-key error
            // on those environments.
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM [Grades] WHERE [Id] = '00000000-0000-0000-0000-000000000011')
INSERT INTO [Grades] ([Id], [AcademicYearId], [Level], [Name], [StageId])
VALUES ('00000000-0000-0000-0000-000000000011', NULL, 1, N'KG1', '00000000-0000-0000-0000-000000000001');

IF NOT EXISTS (SELECT 1 FROM [Grades] WHERE [Id] = '00000000-0000-0000-0000-000000000012')
INSERT INTO [Grades] ([Id], [AcademicYearId], [Level], [Name], [StageId])
VALUES ('00000000-0000-0000-0000-000000000012', NULL, 2, N'KG2', '00000000-0000-0000-0000-000000000001');

IF NOT EXISTS (SELECT 1 FROM [Grades] WHERE [Id] = '00000000-0000-0000-0004-000000000011')
INSERT INTO [Grades] ([Id], [AcademicYearId], [Level], [Name], [StageId])
VALUES ('00000000-0000-0000-0004-000000000011', NULL, 1, N'جامعة', '00000000-0000-0000-0004-000000000001');

IF NOT EXISTS (SELECT 1 FROM [Grades] WHERE [Id] = '00000000-0000-0000-0005-000000000011')
INSERT INTO [Grades] ([Id], [AcademicYearId], [Level], [Name], [StageId])
VALUES ('00000000-0000-0000-0005-000000000011', NULL, 1, N'خريجون', '00000000-0000-0000-0005-000000000001');

IF NOT EXISTS (SELECT 1 FROM [Grades] WHERE [Id] = '00000000-0000-0000-0006-000000000011')
INSERT INTO [Grades] ([Id], [AcademicYearId], [Level], [Name], [StageId])
VALUES ('00000000-0000-0000-0006-000000000011', NULL, 1, N'كبار', '00000000-0000-0000-0006-000000000001');
");
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
