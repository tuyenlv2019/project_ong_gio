namespace OngGio.Application.Services;

public record DashboardStats(
    int TongDonHang,
    int DonHangDangXuLy,
    int DonHangHoanThanh,
    decimal TongTienNguyenLieu,
    decimal TongDoanhThu,
    int TongSanPham,
    int TongLoaiTon,
    int TongNguoiDung);
