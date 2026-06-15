using OngGio.Domain.Common;

namespace OngGio.Domain.Entities;

public class NguoiDung : AuditableEntity
{
    public int Id { get; set; }
    public string TenDangNhap { get; set; } = string.Empty;
    public string HoTen { get; set; } = string.Empty;
    public string MatKhauHash { get; set; } = string.Empty;
    public string VaiTro { get; set; } = "NHAN_VIEN";
    public bool DangHoatDong { get; set; } = true;
}
