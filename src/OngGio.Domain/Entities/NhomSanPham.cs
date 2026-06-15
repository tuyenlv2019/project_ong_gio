using OngGio.Domain.Common;

namespace OngGio.Domain.Entities;

public class NhomSanPham : AuditableEntity
{
    public int Id { get; set; }
    public string TenNhom { get; set; } = string.Empty;
    public string? HinhAnhMinhHoa { get; set; }

    public ICollection<ThamSoCoDinh> ThamSoCoDinhs { get; set; } = [];
    public ICollection<ChiTietBaoGia> ChiTietBaoGias { get; set; } = [];
}
