using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OngGio.Infrastructure.Persistence;

#nullable disable

namespace OngGio.Infrastructure.Migrations;

/// <inheritdoc />
[DbContext(typeof(OngGioDbContext))]
[Migration("20260618160000_AddUniqueIndexToMaBaoGia")]
public partial class AddUniqueIndexToMaBaoGia : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            WITH ranked AS (
                SELECT "Id", "MaBaoGia",
                       ROW_NUMBER() OVER (PARTITION BY "MaBaoGia" ORDER BY "Id") AS rn
                FROM bao_gia
            )
            UPDATE bao_gia bg
            SET "MaBaoGia" = bg."MaBaoGia" || '-DUP-' || bg."Id"::text
            FROM ranked r
            WHERE bg."Id" = r."Id" AND r.rn > 1;
            """);

        migrationBuilder.CreateIndex(
            name: "IX_bao_gia_MaBaoGia",
            table: "bao_gia",
            column: "MaBaoGia",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_bao_gia_MaBaoGia",
            table: "bao_gia");
    }
}
