using System.Text.Json;
using OngGio.Application.Calculation.Formulas;
using OngGio.Domain.Entities;

namespace OngGio.Application.Calculation;

public interface ICalculationEngine
{
    Task<CalculationResult> CalculateAsync(
        NhomSanPham nhomSanPham,
        LoaiTon loaiTon,
        IReadOnlyList<ThamSoCoDinh> thamSoList,
        CalculationRequest request,
        CancellationToken cancellationToken = default);
}

public class CalculationEngine : ICalculationEngine
{
    private readonly IReadOnlyDictionary<string, IAreaFormula> _formulas;

    public CalculationEngine(IEnumerable<IAreaFormula> formulas)
    {
        _formulas = formulas.ToDictionary(f => f.NhomKey, StringComparer.OrdinalIgnoreCase);
    }

    public Task<CalculationResult> CalculateAsync(
        NhomSanPham nhomSanPham,
        LoaiTon loaiTon,
        IReadOnlyList<ThamSoCoDinh> thamSoList,
        CalculationRequest request,
        CancellationToken cancellationToken = default)
    {
        var formulaKey = ResolveFormulaKey(nhomSanPham.TenNhom);
        if (!_formulas.TryGetValue(formulaKey, out var formula))
        {
            throw new InvalidOperationException($"Chưa có công thức cho nhóm sản phẩm: {nhomSanPham.TenNhom}");
        }

        var thamSo = thamSoList.ToDictionary(
            t => t.TenThamSo,
            t => t.GiaTriSo);

        decimal Get(string key, decimal defaultValue = 0m) =>
            thamSo.TryGetValue(key, out var value) ? value : defaultValue;

        var areaResult = formula.Calculate(new AreaFormulaInput(
            request.W,
            request.H,
            Get("R"),
            Get("r"),
            Get("L"),
            Get("mi_8", 8m),
            Get("TDC", 50m),
            Get("mi_Z", 30m)));

        var tongDienTichLo = areaResult.SSx1Cai * request.SoLuong;
        var apDungGiaSan = tongDienTichLo < 1.0m;
        var thanhTienTon = apDungGiaSan
            ? loaiTon.GiaSanCoDinh
            : tongDienTichLo * loaiTon.DonGiaM2;

        var tyTrong = ResolveBarem(loaiTon);
        var trongLuongKg = tongDienTichLo * tyTrong;

        var thanhTienNhanCongPhuKien = (request.GiaNhanCong + request.PhuKien) * request.SoLuong;
        var donGiaCuoi = request.SoLuong > 0
            ? (thanhTienTon + thanhTienNhanCongPhuKien) / request.SoLuong
            : 0m;
        var thanhTien = donGiaCuoi * request.SoLuong;

        var result = new CalculationResult(
            areaResult.SSx1Cai,
            tongDienTichLo,
            trongLuongKg,
            thanhTienTon,
            donGiaCuoi,
            thanhTien,
            apDungGiaSan,
            areaResult.TrangThaiCongThuc);

        return Task.FromResult(result);
    }

    private static string ResolveFormulaKey(string tenNhom)
    {
        var normalized = tenNhom.ToUpperInvariant();
        if (normalized.Contains("CO 90") || normalized.Contains("CO90"))
            return "CO_90";
        if (normalized.Contains("CO 45") || normalized.Contains("CO45"))
            return "CO_45";
        if (normalized.Contains("GIẢM") || normalized.Contains("GIAM"))
            return "GIAM";
        if (normalized.Contains("CHÂN RẼ") || normalized.Contains("CHAN RE") || normalized.Contains("CHAN_RE"))
            return "CHAN_RE";
        if (normalized.Contains("ỐNG THẲNG") || normalized.Contains("ONG THANG"))
            return "ONG_THANG";
        return "CO_90";
    }

    private static decimal ResolveBarem(LoaiTon loaiTon)
    {
        try
        {
            using var doc = JsonDocument.Parse(loaiTon.BangBaremJson);
            foreach (var item in doc.RootElement.EnumerateArray())
            {
                if (!item.TryGetProperty("do_day", out var doDayProp))
                    continue;

                if (doDayProp.GetDecimal() == loaiTon.DoDay &&
                    item.TryGetProperty("ty_trong", out var tyTrongProp))
                {
                    return tyTrongProp.GetDecimal();
                }
            }
        }
        catch (JsonException)
        {
            // fall through to default
        }

        return 4.5m;
    }
}
