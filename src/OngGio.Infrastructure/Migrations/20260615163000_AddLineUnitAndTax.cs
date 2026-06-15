using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OngGio.Infrastructure.Migrations;

/// <inheritdoc />
public partial class AddLineUnitAndTax : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "DonViTinh",
            table: "chi_tiet_bao_gia",
            type: "character varying(50)",
            maxLength: 50,
            nullable: false,
            defaultValue: "cai");

        migrationBuilder.AddColumn<decimal>(
            name: "ThueSuat",
            table: "chi_tiet_bao_gia",
            type: "numeric",
            nullable: false,
            defaultValue: 0.08m);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "DonViTinh",
            table: "chi_tiet_bao_gia");

        migrationBuilder.DropColumn(
            name: "ThueSuat",
            table: "chi_tiet_bao_gia");
    }
}
