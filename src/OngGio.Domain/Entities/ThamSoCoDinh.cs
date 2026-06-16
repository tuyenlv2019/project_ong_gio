// Entity tham số cố định của từng nhóm sản phẩm.
using OngGio.Domain.Common;

namespace OngGio.Domain.Entities;

public class ThamSoCoDinh : AuditableEntity
{
    public int Id { get; set; }
    public int NhomSanPhamId { get; set; }
    public string TenThamSo { get; set; } = string.Empty;
    public decimal GiaTriSo { get; set; }

    public NhomSanPham NhomSanPham { get; set; } = null!;
}
