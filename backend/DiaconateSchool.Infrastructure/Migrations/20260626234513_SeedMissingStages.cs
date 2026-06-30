using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedMissingStages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Stages",
                columns: new[] { "Id", "DisplayOrder", "Name" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000001"), 0, "طفولة" },
                    { new Guid("00000000-0000-0000-0004-000000000001"), 4, "جامعة" },
                    { new Guid("00000000-0000-0000-0005-000000000001"), 5, "خريجون" },
                    { new Guid("00000000-0000-0000-0006-000000000001"), 6, "كبار" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Stages",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "Stages",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0004-000000000001"));

            migrationBuilder.DeleteData(
                table: "Stages",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0005-000000000001"));

            migrationBuilder.DeleteData(
                table: "Stages",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0006-000000000001"));
        }
    }
}
