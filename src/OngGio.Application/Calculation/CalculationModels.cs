namespace OngGio.Application.Calculation;

public record CalculationRequest(
    int NhomSanPhamId,
    int LoaiTonId,
    decimal W,
    decimal H,
    int SoLuong,
    decimal GiaNhanCong,
    decimal PhuKien,
    IReadOnlyDictionary<string, decimal>? ThamSoNhap = null);

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
