using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace OngGio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddManagementFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TrangThai",
                table: "bao_gia",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "DANG_XU_LY");

            migrationBuilder.CreateTable(
                name: "nguoi_dung",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenDangNhap = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    HoTen = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    MatKhauHash = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    VaiTro = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DangHoatDong = table.Column<bool>(type: "boolean", nullable: false),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nguoi_dung", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_nguoi_dung_TenDangNhap",
                table: "nguoi_dung",
                column: "TenDangNhap",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "nguoi_dung");

            migrationBuilder.DropColumn(
                name: "TrangThai",
                table: "bao_gia");
        }
    }
}
