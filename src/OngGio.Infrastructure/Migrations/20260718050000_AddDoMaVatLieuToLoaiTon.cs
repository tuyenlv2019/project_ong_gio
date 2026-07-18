using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OngGio.Infrastructure.Persistence;

#nullable disable

namespace OngGio.Infrastructure.Migrations;

/// <inheritdoc />
[DbContext(typeof(OngGioDbContext))]
[Migration("20260718050000_AddDoMaVatLieuToLoaiTon")]
public partial class AddDoMaVatLieuToLoaiTon : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "DoMaVatLieu",
            table: "loai_ton",
            type: "character varying(100)",
            maxLength: 100,
            nullable: false,
            defaultValue: "");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "DoMaVatLieu",
            table: "loai_ton");
    }
}
