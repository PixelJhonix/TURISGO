using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TuristGo.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceManualFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsManual",
                table: "Invoices",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ManualDescription",
                table: "Invoices",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsManual",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ManualDescription",
                table: "Invoices");
        }
    }
}
