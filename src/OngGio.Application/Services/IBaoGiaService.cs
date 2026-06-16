using OngGio.Application.Calculation;
using OngGio.Domain.Entities;

namespace OngGio.Application.Services;

/// <summary>
/// Hợp đồng nghiệp vụ cho báo giá, preview và export.
/// </summary>
public interface IBaoGiaService
{
    /// <summary>
    /// Tính thử một dòng báo giá.
    /// </summary>
    /// <param name="request">Dữ liệu đầu vào.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Kết quả tính toán preview.</returns>
    Task<CalculationResult> PreviewAsync(CalculationRequest request, CancellationToken ct = default);
    /// <summary>
    /// Tạo báo giá mới.
    /// </summary>
    /// <param name="request">Dữ liệu báo giá cần tạo.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Báo giá vừa tạo.</returns>
    Task<BaoGia> CreateAsync(CreateBaoGiaRequest request, CancellationToken ct = default);
    /// <summary>
    /// Cập nhật báo giá.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="request">Dữ liệu cập nhật.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Báo giá sau khi cập nhật, hoặc null nếu không tìm thấy.</returns>
    Task<BaoGia?> UpdateAsync(int id, CreateBaoGiaRequest request, CancellationToken ct = default);
    /// <summary>
    /// Xóa báo giá theo id.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>True nếu xóa thành công.</returns>
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    /// <summary>
    /// Cập nhật trạng thái báo giá.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="trangThai">Trạng thái mới.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Báo giá sau khi cập nhật trạng thái, hoặc null nếu không tìm thấy.</returns>
    Task<BaoGia?> UpdateStatusAsync(int id, string trangThai, CancellationToken ct = default);
    /// <summary>
    /// Lấy báo giá theo id.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Báo giá hoặc null nếu không tìm thấy.</returns>
    Task<BaoGia?> GetByIdAsync(int id, CancellationToken ct = default);
    /// <summary>
    /// Lấy toàn bộ báo giá.
    /// </summary>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Danh sách báo giá.</returns>
    Task<IReadOnlyList<BaoGia>> GetAllAsync(CancellationToken ct = default);
    /// <summary>
    /// Xuất báo giá ra file Excel.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Dữ liệu file Excel.</returns>
    Task<byte[]> ExportExcelAsync(int id, CancellationToken ct = default);
}

public record CreateBaoGiaLineRequest(
    int NhomSanPhamId,
    int LoaiTonId,
    decimal W,
    decimal H,
    int SoLuong,
    decimal GiaNhanCong,
    decimal PhuKien,
    IReadOnlyDictionary<string, decimal>? ThamSoNhap = null,
    string? TenSanPham = null,
    string? DonViTinh = null,
    decimal ThueSuat = 0.08m);

public record CreateBaoGiaRequest(
    string TenKhachHang,
    decimal ThueSuat,
    IReadOnlyList<CreateBaoGiaLineRequest> Lines);
