using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyHomeworkQuestions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.RenameColumn(
                name: "DisplayOrder",
                table: "HomeworkQuestions",
                newName: "QuestionNumber");

            migrationBuilder.UpdateData(
                table: "HomeworkSubjects",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0100-000000000003"),
                column: "Name",
                value: "محفوظات");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "QuestionNumber",
                table: "HomeworkQuestions",
                newName: "DisplayOrder");

            migrationBuilder.AddColumn<string>(
                name: "OptionA",
                table: "HomeworkQuestions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OptionB",
                table: "HomeworkQuestions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OptionC",
                table: "HomeworkQuestions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OptionD",
                table: "HomeworkQuestions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Text",
                table: "HomeworkQuestions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "HomeworkSubjects",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0100-000000000003"),
                column: "Name",
                value: "الحفظ");
        }
    }
}
