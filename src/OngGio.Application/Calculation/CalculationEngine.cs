using OngGio.Domain.Entities;

namespace OngGio.Application.Calculation;

/// <summary>
/// Engine trung tâm: đánh giá công thức từ DB rồi tính giá trị báo giá.
/// </summary>
public interface ICalculationEngine
{
    /// <summary>
    /// Tính toán kết quả báo giá từ nhóm sản phẩm, loại tôn và tham số đầu vào.
    /// </summary>
    Task<CalculationResult> CalculateAsync(
        NhomSanPham nhomSanPham,
        LoaiTon loaiTon,
        IReadOnlyList<ThamSoCoDinh> thamSoList,
        CalculationRequest request,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Implementation của engine tính toán báo giá.
/// </summary>
public class CalculationEngine : ICalculationEngine
{
    private readonly DbFormulaEvaluator _dbFormulaEvaluator = new();

    public Task<CalculationResult> CalculateAsync(
        NhomSanPham nhomSanPham,
        LoaiTon loaiTon,
        IReadOnlyList<ThamSoCoDinh> thamSoList,
        CalculationRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(nhomSanPham.CongThucDienTich))
        {
            throw new InvalidOperationException($"Chua co cong thuc cho nhom san pham: {nhomSanPham.TenNhom}");
        }

        var thamSo = BuildInputParameters(request);
        var ssx1Cai = _dbFormulaEvaluator.Evaluate(nhomSanPham.CongThucDienTich, thamSo);
        const string trangThaiCongThuc = "XAC_NHAN";

        var dienTichSanXuatMetToi = ssx1Cai / 1.2m;
        var tongDienTichLo = ssx1Cai * request.SoLuong;
        var giaTonMetToi = loaiTon.DonGiaMetToi;
        var thanhTienTon = Math.Round(
            giaTonMetToi * dienTichSanXuatMetToi * request.SoLuong,
            0,
            MidpointRounding.AwayFromZero);
        var trongLuongKg = dienTichSanXuatMetToi * loaiTon.KgMoiMetToi;

        // Đơn giá/cái = giá tôn (đ/mét tới) × diện tích sản xuất mét tới + nhân công + phụ kiện
        var donGiaCuoi = Math.Round(
            giaTonMetToi * dienTichSanXuatMetToi + request.GiaNhanCong + request.PhuKien,
            0,
            MidpointRounding.AwayFromZero);

        var thanhTien = donGiaCuoi * request.SoLuong;

        var result = new CalculationResult(
            ssx1Cai,
            dienTichSanXuatMetToi,
            tongDienTichLo,
            trongLuongKg,
            thanhTienTon,
            donGiaCuoi,
            thanhTien,
            false,
            trangThaiCongThuc);

        return Task.FromResult(result);
    }

    private static Dictionary<string, decimal> BuildInputParameters(CalculationRequest request)
    {
        var thamSo = new Dictionary<string, decimal>(StringComparer.Ordinal)
        {
            ["W"] = request.W,
            ["w"] = request.W,
            ["H"] = request.H,
            ["h"] = request.H,
            ["Wmax"] = request.W,
            ["Hmax"] = request.H,
        };

        if (request.ThamSoNhap is not null)
        {
            foreach (var item in request.ThamSoNhap)
                thamSo[item.Key] = item.Value;
        }

        return thamSo;
    }
}
