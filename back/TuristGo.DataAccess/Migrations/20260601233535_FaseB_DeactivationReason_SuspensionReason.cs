using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TuristGo.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class FaseB_DeactivationReason_SuspensionReason : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SuspensionReason",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeactivationReason",
                table: "Tours",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SuspensionReason",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DeactivationReason",
                table: "Tours");
        }
    }
}
