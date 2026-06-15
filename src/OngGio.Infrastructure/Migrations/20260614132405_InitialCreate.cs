using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace OngGio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "bao_gia",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MaBaoGia = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TenKhachHang = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    NgayTao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ThueSuat = table.Column<decimal>(type: "numeric", nullable: false),
                    TongTienTruocThue = table.Column<decimal>(type: "numeric", nullable: false),
                    TongTienSauThue = table.Column<decimal>(type: "numeric", nullable: false),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bao_gia", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "loai_ton",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ThuongHieu = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DoDay = table.Column<decimal>(type: "numeric", nullable: false),
                    DonGiaM2 = table.Column<decimal>(type: "numeric", nullable: false),
                    GiaSanCoDinh = table.Column<decimal>(type: "numeric", nullable: false),
                    bang_barem = table.Column<string>(type: "jsonb", nullable: false),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_loai_ton", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "nhom_san_pham",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenNhom = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    HinhAnhMinhHoa = table.Column<string>(type: "text", nullable: true),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nhom_san_pham", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "chi_tiet_bao_gia",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BaoGiaId = table.Column<int>(type: "integer", nullable: false),
                    NhomSanPhamId = table.Column<int>(type: "integer", nullable: false),
                    LoaiTonId = table.Column<int>(type: "integer", nullable: false),
                    WInput = table.Column<decimal>(type: "numeric", nullable: false),
                    HInput = table.Column<decimal>(type: "numeric", nullable: false),
                    SoLuong = table.Column<int>(type: "integer", nullable: false),
                    DienTichSx1Cai = table.Column<decimal>(type: "numeric", nullable: false),
                    TongDienTichLo = table.Column<decimal>(type: "numeric", nullable: false),
                    TrongLuongKg = table.Column<decimal>(type: "numeric", nullable: false),
                    ThanhTienTon = table.Column<decimal>(type: "numeric", nullable: false),
                    GiaNhanCong = table.Column<decimal>(type: "numeric", nullable: false),
                    PhuKien = table.Column<decimal>(type: "numeric", nullable: false),
                    DonGiaCuoi = table.Column<decimal>(type: "numeric", nullable: false),
                    ThanhTien = table.Column<decimal>(type: "numeric", nullable: false),
                    TrangThaiCongThuc = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chi_tiet_bao_gia", x => x.Id);
                    table.ForeignKey(
                        name: "FK_chi_tiet_bao_gia_bao_gia_BaoGiaId",
                        column: x => x.BaoGiaId,
                        principalTable: "bao_gia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_chi_tiet_bao_gia_loai_ton_LoaiTonId",
                        column: x => x.LoaiTonId,
                        principalTable: "loai_ton",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_chi_tiet_bao_gia_nhom_san_pham_NhomSanPhamId",
                        column: x => x.NhomSanPhamId,
                        principalTable: "nhom_san_pham",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tham_so_co_dinh",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NhomSanPhamId = table.Column<int>(type: "integer", nullable: false),
                    TenThamSo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    GiaTriSo = table.Column<decimal>(type: "numeric", nullable: false),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tham_so_co_dinh", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tham_so_co_dinh_nhom_san_pham_NhomSanPhamId",
                        column: x => x.NhomSanPhamId,
                        principalTable: "nhom_san_pham",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_chi_tiet_bao_gia_BaoGiaId",
                table: "chi_tiet_bao_gia",
                column: "BaoGiaId");

            migrationBuilder.CreateIndex(
                name: "IX_chi_tiet_bao_gia_LoaiTonId",
                table: "chi_tiet_bao_gia",
                column: "LoaiTonId");

            migrationBuilder.CreateIndex(
                name: "IX_chi_tiet_bao_gia_NhomSanPhamId",
                table: "chi_tiet_bao_gia",
                column: "NhomSanPhamId");

            migrationBuilder.CreateIndex(
                name: "IX_tham_so_co_dinh_NhomSanPhamId",
                table: "tham_so_co_dinh",
                column: "NhomSanPhamId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "chi_tiet_bao_gia");

            migrationBuilder.DropTable(
                name: "tham_so_co_dinh");

            migrationBuilder.DropTable(
                name: "bao_gia");

            migrationBuilder.DropTable(
                name: "loai_ton");

            migrationBuilder.DropTable(
                name: "nhom_san_pham");
        }
    }
}
