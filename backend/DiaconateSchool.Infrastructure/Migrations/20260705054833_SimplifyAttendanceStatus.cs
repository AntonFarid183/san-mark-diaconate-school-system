using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyAttendanceStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Old enum: Present=0, Late=1, Absent=2, Excused=3
            // New enum: Present=0, Absent=1
            // Convert all non-Present statuses to Absent(1)
            migrationBuilder.Sql("UPDATE AttendanceRecords SET Status = 1 WHERE Status != 0;");
            migrationBuilder.Sql("UPDATE AttendanceAuditLogs SET OldStatus = 1 WHERE OldStatus IS NOT NULL AND OldStatus != 0;");
            migrationBuilder.Sql("UPDATE AttendanceAuditLogs SET NewStatus = 1 WHERE NewStatus != 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Cannot restore original Late/Excused distinctions — data was merged into Absent
        }
    }
}
