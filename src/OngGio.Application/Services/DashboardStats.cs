// DTO thống kê hiển thị trên dashboard.
namespace OngGio.Application.Services;

public record DashboardStats(
    int TongDonHang,
    int DonHangChuaXuLy,
    int DonHangDangXuLy,
    int DonHangHoanThanh,
    decimal TongTienNguyenLieu,
    decimal TongDoanhThu,
    int TongSanPham,
    int TongLoaiTon,
    int TongNguoiDung);
