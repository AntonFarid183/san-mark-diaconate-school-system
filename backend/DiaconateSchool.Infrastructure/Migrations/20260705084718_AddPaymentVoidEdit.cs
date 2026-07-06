using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiaconateSchool.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentVoidEdit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVoided",
                table: "PaymentTransactions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "VoidReason",
                table: "PaymentTransactions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "VoidedAt",
                table: "PaymentTransactions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VoidedByUserId",
                table: "PaymentTransactions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_VoidedByUserId",
                table: "PaymentTransactions",
                column: "VoidedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentTransactions_Users_VoidedByUserId",
                table: "PaymentTransactions",
                column: "VoidedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PaymentTransactions_Users_VoidedByUserId",
                table: "PaymentTransactions");

            migrationBuilder.DropIndex(
                name: "IX_PaymentTransactions_VoidedByUserId",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "IsVoided",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "VoidReason",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "VoidedAt",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "VoidedByUserId",
                table: "PaymentTransactions");
        }
    }
}
