using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClassIdToAttendanceSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Pre-existing attendance data has no class assignment (attendance was previously grade-level).
            // This is dev/test data — clear it so the new required ClassId FK can be added cleanly.
            migrationBuilder.Sql("DELETE FROM AttendanceAuditLogs;");
            migrationBuilder.Sql("DELETE FROM AttendanceRecords;");
            migrationBuilder.Sql("DELETE FROM AttendanceSessions;");

            migrationBuilder.AddColumn<Guid>(
                name: "ClassId",
                table: "AttendanceSessions",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceSessions_ClassId_StartsAt",
                table: "AttendanceSessions",
                columns: new[] { "ClassId", "StartsAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_AttendanceSessions_SchoolClasses_ClassId",
                table: "AttendanceSessions",
                column: "ClassId",
                principalTable: "SchoolClasses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // Standardize class identifiers to Latin letters (A, B, C...) instead of Arabic (أ, ب, ج...)
            migrationBuilder.Sql("UPDATE SchoolClasses SET Name = 'A' WHERE Name = N'أ';");
            migrationBuilder.Sql("UPDATE SchoolClasses SET Name = 'B' WHERE Name = N'ب';");
            migrationBuilder.Sql("UPDATE SchoolClasses SET Name = 'C' WHERE Name = N'ج';");
            migrationBuilder.Sql("UPDATE SchoolClasses SET Name = 'D' WHERE Name = N'د';");
            migrationBuilder.Sql("UPDATE SchoolClasses SET Name = 'E' WHERE Name = N'هـ';");
            migrationBuilder.Sql("UPDATE SchoolClasses SET Name = 'F' WHERE Name = N'و';");
            migrationBuilder.Sql("UPDATE SchoolClasses SET Name = 'G' WHERE Name = N'ز';");
            migrationBuilder.Sql("UPDATE SchoolClasses SET Name = 'H' WHERE Name = N'ح';");
            migrationBuilder.Sql("UPDATE SchoolClasses SET Name = 'I' WHERE Name = N'ط';");
            migrationBuilder.Sql("UPDATE SchoolClasses SET Name = 'J' WHERE Name = N'ي';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AttendanceSessions_SchoolClasses_ClassId",
                table: "AttendanceSessions");

            migrationBuilder.DropIndex(
                name: "IX_AttendanceSessions_ClassId_StartsAt",
                table: "AttendanceSessions");

            migrationBuilder.DropColumn(
                name: "ClassId",
                table: "AttendanceSessions");
        }
    }
}
