using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using OngGio.Infrastructure.Persistence;

#nullable disable

namespace OngGio.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(OngGioDbContext))]
    [Migration("20260615143000_AddLineInputParameters")]
    public partial class AddLineInputParameters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "tham_so_nhap",
                table: "chi_tiet_bao_gia",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "tham_so_nhap",
                table: "chi_tiet_bao_gia");
        }
    }
}
