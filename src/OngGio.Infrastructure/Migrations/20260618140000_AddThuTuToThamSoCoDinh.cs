using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OngGio.Infrastructure.Persistence;

#nullable disable

namespace OngGio.Infrastructure.Migrations;

/// <inheritdoc />
[DbContext(typeof(OngGioDbContext))]
[Migration("20260618140000_AddThuTuToThamSoCoDinh")]
public partial class AddThuTuToThamSoCoDinh : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "ThuTu",
            table: "tham_so_co_dinh",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.Sql("""
            WITH ranked AS (
                SELECT "Id", ROW_NUMBER() OVER (PARTITION BY "NhomSanPhamId" ORDER BY "Id") - 1 AS ord
                FROM tham_so_co_dinh
            )
            UPDATE tham_so_co_dinh t
            SET "ThuTu" = r.ord
            FROM ranked r
            WHERE t."Id" = r."Id";
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "ThuTu",
            table: "tham_so_co_dinh");
    }
}
