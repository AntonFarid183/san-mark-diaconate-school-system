using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTypedHomeworkQuestions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OptionA",
                table: "HomeworkQuestions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionB",
                table: "HomeworkQuestions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionC",
                table: "HomeworkQuestions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionD",
                table: "HomeworkQuestions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Text",
                table: "HomeworkQuestions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OptionA",
                table: "HomeworkQuestions");

            migrationBuilder.DropColumn(
                name: "OptionB",
                table: "HomeworkQuestions");

            migrationBuilder.DropColumn(
                name: "OptionC",
                table: "HomeworkQuestions");

            migrationBuilder.DropColumn(
                name: "OptionD",
                table: "HomeworkQuestions");

            migrationBuilder.DropColumn(
                name: "Text",
                table: "HomeworkQuestions");
        }
    }
}
