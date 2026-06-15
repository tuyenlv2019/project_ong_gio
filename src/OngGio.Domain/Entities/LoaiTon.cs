using OngGio.Domain.Common;

namespace OngGio.Domain.Entities;

public class LoaiTon : AuditableEntity
{
    public int Id { get; set; }
    public string ThuongHieu { get; set; } = string.Empty;
    public decimal DoDay { get; set; }
    public decimal DonGiaM2 { get; set; }
    public decimal GiaSanCoDinh { get; set; }
    public string BangBaremJson { get; set; } = "[]";

    public ICollection<ChiTietBaoGia> ChiTietBaoGias { get; set; } = [];
}
