namespace OngGio.Application.Calculation;

/// <summary>
/// Dữ liệu đầu vào chuẩn cho chức năng tính toán.
/// </summary>
public record CalculationRequest(
    int NhomSanPhamId,
    int LoaiTonId,
    decimal W,
    decimal H,
    int SoLuong,
    decimal GiaNhanCong,
    decimal PhuKien,
    IReadOnlyDictionary<string, decimal>? ThamSoNhap = null);

/// <summary>
/// Kết quả tính toán của engine.
/// </summary>
public record CalculationResult(
    decimal DienTichSx1Cai,
    decimal DienTichSanXuatMetToi,
    decimal TongDienTichLo,
    decimal TrongLuongKg,
    decimal ThanhTienTon,
    decimal DonGiaCuoi,
    decimal ThanhTien,
    bool ApDungGiaSan,
    string TrangThaiCongThuc);
