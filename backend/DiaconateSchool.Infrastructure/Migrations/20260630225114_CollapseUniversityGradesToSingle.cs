using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CollapseUniversityGradesToSingle : Migration
    {
        // University stage + its grade rows
        private const string UniversityStageId = "00000000-0000-0000-0004-000000000001";
        private const string KeepGradeId = "00000000-0000-0000-0004-000000000011";
        private static readonly string[] ExtraGradeIds =
        {
            "00000000-0000-0000-0004-000000000012",
            "00000000-0000-0000-0004-000000000013",
            "00000000-0000-0000-0004-000000000014",
            "00000000-0000-0000-0004-000000000015",
            "00000000-0000-0000-0004-000000000016",
            "00000000-0000-0000-0004-000000000017",
        };

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // University is now a single grade ("جامعة") like "خريجون".
            // Re-point every reference from the old year-grades (السنة 2..7) onto the kept grade,
            // then remove the extra year-grades and rename the kept one.
            string extra = "'" + string.Join("','", ExtraGradeIds) + "'";

            migrationBuilder.Sql($"UPDATE Students         SET GradeId     = '{KeepGradeId}' WHERE GradeId     IN ({extra});");
            migrationBuilder.Sql($"UPDATE Curriculums      SET GradeId     = '{KeepGradeId}' WHERE GradeId     IN ({extra});");
            migrationBuilder.Sql($"UPDATE HymnLessons      SET GradeId     = '{KeepGradeId}' WHERE GradeId     IN ({extra});");
            migrationBuilder.Sql($"UPDATE Lessons          SET GradeId     = '{KeepGradeId}' WHERE GradeId     IN ({extra});");
            migrationBuilder.Sql($"UPDATE GradeHistories   SET FromGradeId = '{KeepGradeId}' WHERE FromGradeId IN ({extra});");
            migrationBuilder.Sql($"UPDATE GradeHistories   SET ToGradeId   = '{KeepGradeId}' WHERE ToGradeId   IN ({extra});");
            migrationBuilder.Sql($"UPDATE AttendanceSessions SET GradeId   = '{KeepGradeId}' WHERE GradeId     IN ({extra});");
            migrationBuilder.Sql($"UPDATE Exams            SET GradeId     = '{KeepGradeId}' WHERE GradeId     IN ({extra});");

            migrationBuilder.Sql($"DELETE FROM Grades WHERE Id IN ({extra});");
            migrationBuilder.Sql($"UPDATE Grades SET Name = N'جامعة', Level = 1 WHERE Id = '{KeepGradeId}';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Best-effort restore of the year-grade structure (re-pointed rows cannot be un-merged).
            migrationBuilder.Sql($"UPDATE Grades SET Name = N'السنة 1', Level = 1 WHERE Id = '{KeepGradeId}';");

            for (int i = 0; i < ExtraGradeIds.Length; i++)
            {
                int year = i + 2; // السنة 2..7
                migrationBuilder.Sql(
                    $"IF NOT EXISTS (SELECT 1 FROM Grades WHERE Id = '{ExtraGradeIds[i]}') " +
                    $"INSERT INTO Grades (Id, Name, Level, StageId) " +
                    $"VALUES ('{ExtraGradeIds[i]}', N'السنة {year}', {year}, '{UniversityStageId}');");
            }
        }
    }
}
