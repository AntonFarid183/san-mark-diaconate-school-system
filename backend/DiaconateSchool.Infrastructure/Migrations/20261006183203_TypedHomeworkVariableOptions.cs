using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TypedHomeworkVariableOptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Typed homeworks only existed with the old fixed A-D columns for a short while;
            // their option text can't be carried over, so drop them (answers first: Restrict FK).
            migrationBuilder.Sql("DELETE FROM HomeworkAnswers WHERE HomeworkQuestionId IN (SELECT q.Id FROM HomeworkQuestions q JOIN Homeworks h ON h.Id = q.HomeworkId WHERE h.MaterialType = 2)");
            migrationBuilder.Sql("DELETE FROM Homeworks WHERE MaterialType = 2");

            migrationBuilder.DropColumn(
                name: "OptionA",
                table: "HomeworkQuestions");

            migrationBuilder.DropColumn(
                name: "OptionB",
                table: "HomeworkQuestions");

            migrationBuilder.DropColumn(
                name: "OptionC",
                table: "HomeworkQuestions");

            migrationBuilder.RenameColumn(
                name: "OptionD",
                table: "HomeworkQuestions",
                newName: "OptionsJson");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "OptionsJson",
                table: "HomeworkQuestions",
                newName: "OptionD");

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
        }
    }
}
