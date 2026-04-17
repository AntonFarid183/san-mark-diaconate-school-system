using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGradeEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Stage",
                table: "Students");

            migrationBuilder.AddColumn<Guid>(
                name: "GradeId",
                table: "Students",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0001-000000000001"));

            migrationBuilder.CreateTable(
                name: "Grades",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Level = table.Column<int>(type: "int", nullable: false),
                    Stage = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Grades", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Grades",
                columns: new[] { "Id", "Level", "Name", "Stage" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0001-000000000001"), 1, "الصف 1 الابتدائي", 2 },
                    { new Guid("00000000-0000-0000-0001-000000000002"), 2, "الصف 2 الابتدائي", 2 },
                    { new Guid("00000000-0000-0000-0001-000000000003"), 3, "الصف 3 الابتدائي", 2 },
                    { new Guid("00000000-0000-0000-0001-000000000004"), 4, "الصف 4 الابتدائي", 2 },
                    { new Guid("00000000-0000-0000-0001-000000000005"), 5, "الصف 5 الابتدائي", 2 },
                    { new Guid("00000000-0000-0000-0001-000000000006"), 6, "الصف 6 الابتدائي", 2 },
                    { new Guid("00000000-0000-0000-0002-000000000001"), 1, "الصف 1 الإعدادي", 3 },
                    { new Guid("00000000-0000-0000-0002-000000000002"), 2, "الصف 2 الإعدادي", 3 },
                    { new Guid("00000000-0000-0000-0002-000000000003"), 3, "الصف 3 الإعدادي", 3 },
                    { new Guid("00000000-0000-0000-0003-000000000001"), 1, "الصف 1 الثانوي", 4 },
                    { new Guid("00000000-0000-0000-0003-000000000002"), 2, "الصف 2 الثانوي", 4 },
                    { new Guid("00000000-0000-0000-0003-000000000003"), 3, "الصف 3 الثانوي", 4 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Students_GradeId",
                table: "Students",
                column: "GradeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Students_Grades_GradeId",
                table: "Students",
                column: "GradeId",
                principalTable: "Grades",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Students_Grades_GradeId",
                table: "Students");

            migrationBuilder.DropTable(
                name: "Grades");

            migrationBuilder.DropIndex(
                name: "IX_Students_GradeId",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "GradeId",
                table: "Students");

            migrationBuilder.AddColumn<int>(
                name: "Stage",
                table: "Students",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
