using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEssayQuestions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Kind",
                table: "HomeworkQuestions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "AnswerFileName",
                table: "HomeworkAnswers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AnswerFileUrl",
                table: "HomeworkAnswers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AnswerText",
                table: "HomeworkAnswers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EssayScore",
                table: "HomeworkAnswers",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Kind",
                table: "HomeworkQuestions");

            migrationBuilder.DropColumn(
                name: "AnswerFileName",
                table: "HomeworkAnswers");

            migrationBuilder.DropColumn(
                name: "AnswerFileUrl",
                table: "HomeworkAnswers");

            migrationBuilder.DropColumn(
                name: "AnswerText",
                table: "HomeworkAnswers");

            migrationBuilder.DropColumn(
                name: "EssayScore",
                table: "HomeworkAnswers");
        }
    }
}
