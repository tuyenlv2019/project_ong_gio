// Entity tham số đầu vào (tên field) mà người dùng nhập trên form đơn hàng.
using OngGio.Domain.Common;

namespace OngGio.Domain.Entities;

public class ThamSoCoDinh : AuditableEntity
{
    public int Id { get; set; }
    public int NhomSanPhamId { get; set; }
    public string TenThamSo { get; set; } = string.Empty;
    public decimal GiaTriSo { get; set; }
    /// <summary>Thứ tự hiển thị trên form đơn hàng (0-based).</summary>
    public int ThuTu { get; set; }

    public NhomSanPham NhomSanPham { get; set; } = null!;
}
