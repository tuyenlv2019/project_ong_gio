using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OngGio.Infrastructure.Persistence;

#nullable disable

namespace OngGio.Infrastructure.Migrations;

/// <inheritdoc />
[DbContext(typeof(OngGioDbContext))]
[Migration("20260618120000_AddCongThucDienTichToNhomSanPham")]
public partial class AddCongThucDienTichToNhomSanPham : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "CongThucDienTich",
            table: "nhom_san_pham",
            type: "text",
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "CongThucDienTich",
            table: "nhom_san_pham");
    }
}
