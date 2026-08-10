using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddQrTokenToStudent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "QrToken",
                table: "Students",
                type: "nvarchar(450)",
                nullable: true);

            // Every existing student needs a distinct token before the unique index
            // below can be created — REPLACE strips NEWID()'s dashes to match the
            // 32-hex-char format StudentRegistrationService.GenerateQrToken() produces
            // for every new student going forward.
            migrationBuilder.Sql(@"UPDATE Students SET QrToken = REPLACE(CAST(NEWID() AS nvarchar(36)), '-', '') WHERE QrToken IS NULL;");

            migrationBuilder.AlterColumn<string>(
                name: "QrToken",
                table: "Students",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Students_QrToken",
                table: "Students",
                column: "QrToken",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Students_QrToken",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "QrToken",
                table: "Students");
        }
    }
}
