using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TuristGo.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddTourImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Tours",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Tours");
        }
    }
}
