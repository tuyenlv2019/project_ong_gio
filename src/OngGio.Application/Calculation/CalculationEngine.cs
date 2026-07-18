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
        if (PhanManhRule.AppliesTo(thamSoList))
            thamSo[PhanManhRule.ParameterName] = PhanManhRule.Calculate(request.W, request.H);

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
            ["W1"] = request.W,
            ["H"] = request.H,
            ["h"] = request.H,
            ["H1"] = request.H,
            ["Wmax"] = request.W,
            ["Hmax"] = request.H,
        };

        if (request.ThamSoNhap is not null)
        {
            foreach (var item in request.ThamSoNhap)
                thamSo[item.Key] = item.Value;
        }

        // Alias thương mại: N (độ lệch) ↔ DO_LECH; Wp (nhánh Tê) ↔ W2
        if (thamSo.TryGetValue("DO_LECH", out var doLech) && !thamSo.ContainsKey("N"))
            thamSo["N"] = doLech;
        if (thamSo.TryGetValue("N", out var n) && !thamSo.ContainsKey("DO_LECH"))
            thamSo["DO_LECH"] = n;
        if (thamSo.TryGetValue("Wp", out var wp) && !thamSo.ContainsKey("W2"))
            thamSo["W2"] = wp;
        if (thamSo.TryGetValue("W2", out var w2) && !thamSo.ContainsKey("Wp"))
            thamSo["Wp"] = w2;

        return thamSo;
    }
}
