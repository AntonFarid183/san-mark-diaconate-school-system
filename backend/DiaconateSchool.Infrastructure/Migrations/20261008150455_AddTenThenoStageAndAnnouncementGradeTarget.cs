using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTenThenoStageAndAnnouncementGradeTarget : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TargetGradeId",
                table: "Announcements",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.InsertData(
                table: "Stages",
                columns: new[] { "Id", "DisplayOrder", "Name" },
                values: new object[] { new Guid("00000000-0000-0000-0007-000000000001"), 7, "معهد تين ثينو" });

            migrationBuilder.InsertData(
                table: "Grades",
                columns: new[] { "Id", "AcademicYearId", "Level", "Name", "StageId" },
                values: new object[] { new Guid("00000000-0000-0000-0007-000000000011"), null, 1, "معهد تين ثينو", new Guid("00000000-0000-0000-0007-000000000001") });

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_TargetGradeId",
                table: "Announcements",
                column: "TargetGradeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Announcements_Grades_TargetGradeId",
                table: "Announcements",
                column: "TargetGradeId",
                principalTable: "Grades",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Announcements_Grades_TargetGradeId",
                table: "Announcements");

            migrationBuilder.DropIndex(
                name: "IX_Announcements_TargetGradeId",
                table: "Announcements");

            migrationBuilder.DeleteData(
                table: "Grades",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0007-000000000011"));

            migrationBuilder.DeleteData(
                table: "Stages",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0007-000000000001"));

            migrationBuilder.DropColumn(
                name: "TargetGradeId",
                table: "Announcements");
        }
    }
}
