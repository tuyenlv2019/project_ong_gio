using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OngGio.Infrastructure.Persistence;

#nullable disable

namespace OngGio.Infrastructure.Migrations;

/// <inheritdoc />
[DbContext(typeof(OngGioDbContext))]
[Migration("20260618170000_RenameDonGiaM2ToDonGiaMetToi")]
public partial class RenameDonGiaM2ToDonGiaMetToi : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.RenameColumn(
            name: "DonGiaM2",
            table: "loai_ton",
            newName: "DonGiaMetToi");

        // Đổi đơn vị từ đ/m² sang đ/mét tới (m² / 1.2 = mét tới → đ/mét tới = đ/m² × 1.2)
        migrationBuilder.Sql("""
            UPDATE loai_ton SET "DonGiaMetToi" = "DonGiaMetToi" * 1.2;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            UPDATE loai_ton SET "DonGiaMetToi" = "DonGiaMetToi" / 1.2;
            """);

        migrationBuilder.RenameColumn(
            name: "DonGiaMetToi",
            table: "loai_ton",
            newName: "DonGiaM2");
    }
}
