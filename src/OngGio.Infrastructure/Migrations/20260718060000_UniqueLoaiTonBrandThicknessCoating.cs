using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OngGio.Infrastructure.Persistence;

#nullable disable

namespace OngGio.Infrastructure.Migrations;

/// <inheritdoc />
[DbContext(typeof(OngGioDbContext))]
[Migration("20260718060000_UniqueLoaiTonBrandThicknessCoating")]
public partial class UniqueLoaiTonBrandThicknessCoating : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateIndex(
            name: "IX_loai_ton_ThuongHieu_DoDay_DoMaVatLieu",
            table: "loai_ton",
            columns: new[] { "ThuongHieu", "DoDay", "DoMaVatLieu" },
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_loai_ton_ThuongHieu_DoDay_DoMaVatLieu",
            table: "loai_ton");
    }
}
