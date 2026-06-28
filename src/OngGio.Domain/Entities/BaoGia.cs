// Entity báo giá gốc, chứa thông tin khách hàng, thuế và tổng tiền.
using System.ComponentModel.DataAnnotations.Schema;
using OngGio.Domain.Common;

namespace OngGio.Domain.Entities;

public class BaoGia : AuditableEntity
{
    public int Id { get; set; }
    public string MaBaoGia { get; set; } = string.Empty;
    public string TenKhachHang { get; set; } = string.Empty;
    public DateTime NgayTao { get; set; }
    public decimal ThueSuat { get; set; } = 0.08m;
    public decimal TongTienTruocThue { get; set; }
    public decimal TongTienSauThue { get; set; }
    public string TrangThai { get; set; } = "CHUA_XU_LY";

    [NotMapped]
    public int TongSoSanPham { get; set; }

    public ICollection<ChiTietBaoGia> ChiTietBaoGias { get; set; } = [];
}
