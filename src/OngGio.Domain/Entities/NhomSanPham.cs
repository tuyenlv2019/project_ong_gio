// Entity nhóm sản phẩm: công thức ∑Ssx và danh sách tham số form.
using OngGio.Domain.Common;

namespace OngGio.Domain.Entities;

public class NhomSanPham : AuditableEntity
{
    public int Id { get; set; }
    public string TenNhom { get; set; } = string.Empty;
    public string? HinhAnhMinhHoa { get; set; }
    /// <summary>Mô tả công thức tính diện tích sản xuất ∑Ssx (m²).</summary>
    public string? CongThucDienTich { get; set; }

    public ICollection<ThamSoCoDinh> ThamSoCoDinhs { get; set; } = [];
    public ICollection<ChiTietBaoGia> ChiTietBaoGias { get; set; } = [];
}
