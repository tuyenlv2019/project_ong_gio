// Entity chi tiết báo giá, lưu dữ liệu tính toán của từng dòng.
using OngGio.Domain.Common;

namespace OngGio.Domain.Entities;

public class ChiTietBaoGia : AuditableEntity
{
    public int Id { get; set; }
    public int BaoGiaId { get; set; }
    public int NhomSanPhamId { get; set; }
    public int LoaiTonId { get; set; }
    public string? TenSanPham { get; set; }
    public string DonViTinh { get; set; } = "cai";
    public decimal WInput { get; set; }
    public decimal HInput { get; set; }
    public int SoLuong { get; set; }
    public decimal ThueSuat { get; set; } = 0.08m;
    public decimal DienTichSx1Cai { get; set; }
    public decimal TongDienTichLo { get; set; }
    public decimal TrongLuongKg { get; set; }
    public decimal ThanhTienTon { get; set; }
    public decimal GiaNhanCong { get; set; }
    public decimal PhuKien { get; set; }
    public string? ThamSoNhapJson { get; set; }
    public decimal DonGiaCuoi { get; set; }
    public decimal ThanhTien { get; set; }
    public string TrangThaiCongThuc { get; set; } = "XAC_NHAN";

    public BaoGia BaoGia { get; set; } = null!;
    public NhomSanPham NhomSanPham { get; set; } = null!;
    public LoaiTon LoaiTon { get; set; } = null!;
}
