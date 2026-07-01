using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaidAmountToStudent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PaidAmount",
                table: "Students",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaidAmount",
                table: "Students");
        }
    }
}
