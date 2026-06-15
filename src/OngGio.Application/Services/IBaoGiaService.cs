using OngGio.Application.Calculation;
using OngGio.Domain.Entities;

namespace OngGio.Application.Services;

public interface IBaoGiaService
{
    Task<CalculationResult> PreviewAsync(CalculationRequest request, CancellationToken ct = default);
    Task<BaoGia> CreateAsync(CreateBaoGiaRequest request, CancellationToken ct = default);
    Task<BaoGia?> UpdateAsync(int id, CreateBaoGiaRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<BaoGia?> UpdateStatusAsync(int id, string trangThai, CancellationToken ct = default);
    Task<BaoGia?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<BaoGia>> GetAllAsync(CancellationToken ct = default);
    Task<byte[]> ExportExcelAsync(int id, CancellationToken ct = default);
}

public record CreateBaoGiaLineRequest(
    int NhomSanPhamId,
    int LoaiTonId,
    decimal W,
    decimal H,
    int SoLuong,
    decimal GiaNhanCong,
    decimal PhuKien);

public record CreateBaoGiaRequest(
    string TenKhachHang,
    decimal ThueSuat,
    IReadOnlyList<CreateBaoGiaLineRequest> Lines);
