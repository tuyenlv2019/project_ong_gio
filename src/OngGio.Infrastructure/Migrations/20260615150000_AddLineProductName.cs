using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using OngGio.Infrastructure.Persistence;

#nullable disable

namespace OngGio.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(OngGioDbContext))]
    [Migration("20260615150000_AddLineProductName")]
    public partial class AddLineProductName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TenSanPham",
                table: "chi_tiet_bao_gia",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TenSanPham",
                table: "chi_tiet_bao_gia");
        }
    }
}
