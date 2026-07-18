using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OngGio.Infrastructure.Persistence;

#nullable disable

namespace OngGio.Infrastructure.Migrations;

/// <inheritdoc />
[DbContext(typeof(OngGioDbContext))]
[Migration("20260718053000_DropLoaiTonGiaSanCoDinh")]
public partial class DropLoaiTonGiaSanCoDinh : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "GiaSanCoDinh",
            table: "loai_ton");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<decimal>(
            name: "GiaSanCoDinh",
            table: "loai_ton",
            type: "numeric",
            nullable: false,
            defaultValue: 0m);
    }
}
