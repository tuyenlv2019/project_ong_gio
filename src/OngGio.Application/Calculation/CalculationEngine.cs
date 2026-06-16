using System.Globalization;
using System.Text;
using OngGio.Application.Calculation.Formulas;
using OngGio.Domain.Entities;

namespace OngGio.Application.Calculation;

/// <summary>
/// Engine trung tâm: chọn công thức, ghép tham số và tính giá trị báo giá.
/// </summary>
public interface ICalculationEngine
{
    /// <summary>
    /// Tính toán kết quả báo giá từ nhóm sản phẩm, loại tôn và tham số đầu vào.
    /// </summary>
    /// <param name="nhomSanPham">Nhóm sản phẩm được chọn.</param>
    /// <param name="loaiTon">Loại tôn được chọn.</param>
    /// <param name="thamSoList">Danh sách tham số cố định của nhóm.</param>
    /// <param name="request">Dữ liệu người dùng nhập.</param>
    /// <param name="cancellationToken">Cancellation token của request.</param>
    /// <returns>Kết quả tính toán báo giá.</returns>
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
    private readonly IReadOnlyDictionary<string, IAreaFormula> _formulas;

    public CalculationEngine(IEnumerable<IAreaFormula> formulas)
    {
        _formulas = formulas.ToDictionary(f => f.NhomKey, StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Thực hiện tính toán theo công thức tương ứng với nhóm sản phẩm.
    /// </summary>
    /// <param name="nhomSanPham">Nhóm sản phẩm.</param>
    /// <param name="loaiTon">Loại tôn.</param>
    /// <param name="thamSoList">Tham số cố định.</param>
    /// <param name="request">Dữ liệu đầu vào.</param>
    /// <param name="cancellationToken">Cancellation token của request.</param>
    /// <returns>Kết quả tính toán.</returns>
    public Task<CalculationResult> CalculateAsync(
        NhomSanPham nhomSanPham,
        LoaiTon loaiTon,
        IReadOnlyList<ThamSoCoDinh> thamSoList,
        CalculationRequest request,
        CancellationToken cancellationToken = default)
    {
        var formulaKey = ResolveFormulaKey(nhomSanPham.TenNhom);
        if (!_formulas.TryGetValue(formulaKey, out var formula))
            throw new InvalidOperationException($"Chua co cong thuc cho nhom san pham: {nhomSanPham.TenNhom}");

        var thamSo = thamSoList.ToDictionary(
            t => t.TenThamSo,
            t => t.GiaTriSo,
            StringComparer.Ordinal);

        if (request.ThamSoNhap is not null)
        {
            foreach (var item in request.ThamSoNhap)
                thamSo[item.Key] = item.Value;
        }

        decimal Get(decimal defaultValue = 0m, params string[] keys)
        {
            foreach (var key in keys)
            {
                if (thamSo.TryGetValue(key, out var value))
                    return value;

                var match = thamSo.FirstOrDefault(x => string.Equals(x.Key, key, StringComparison.OrdinalIgnoreCase));
                if (!string.IsNullOrEmpty(match.Key))
                    return match.Value;
            }

            return defaultValue;
        }

        var areaResult = formula.Calculate(new AreaFormulaInput(
            request.W,
            request.H,
            Get(0m, "R"),
            Get(0m, "r", "r(max)", "r_max"),
            Get(0m, "L"),
            Get(8m, "mi_8", "mi 8"),
            Get(50m, "TDC"),
            Get(30m, "mi_Z", "mi Z"),
            thamSo));

        var dienTichSanXuatMetToi = areaResult.SSx1Cai / 1.2m;
        var tongDienTichLo = areaResult.SSx1Cai * request.SoLuong;
        var apDungGiaSan = false;
        var thanhTienTon = tongDienTichLo * loaiTon.DonGiaM2;

        var trongLuongKg = dienTichSanXuatMetToi * loaiTon.KgMoiMetToi;

        var thanhTienNhanCongPhuKien = (request.GiaNhanCong + request.PhuKien) * request.SoLuong;
        var donGiaCuoi = request.SoLuong > 0
            ? (thanhTienTon + thanhTienNhanCongPhuKien) / request.SoLuong
            : 0m;
        var thanhTien = donGiaCuoi * request.SoLuong;

        var result = new CalculationResult(
            areaResult.SSx1Cai,
            dienTichSanXuatMetToi,
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
        var normalized = NormalizeKey(tenNhom);
        if (normalized.Contains("CO 90") || normalized.Contains("CO90"))
            return "CO_90";
        if (normalized.Contains("CO 45") || normalized.Contains("CO45"))
            return "CO_45";
        if (normalized.Contains("GIAM") || normalized.Contains("CON THU"))
            return "GIAM";
        if (normalized.Contains("CHAN RE") || normalized.Contains("GIAY KHOI HANH") || normalized.Contains("COLLAR"))
            return "CHAN_RE";
        if (normalized.Contains("BIT 01") || normalized.Contains("BIT 1") || normalized.Contains("BIT MOT"))
            return "ONG_BIT_1_DAU";
        if (normalized.Contains("BIT 02") || normalized.Contains("BIT 2") || normalized.Contains("BIT HAI"))
            return "ONG_BIT_2_DAU";
        if (normalized.Contains("BZ") || normalized.Contains("LECH TAM") || normalized.Contains("CO NGONG"))
            return "BZ";
        if (normalized.Contains("TE CUT"))
            return "TE_CUT";
        if (normalized.Contains("TE RE"))
            return "TE_RE";
        if (normalized.Contains("HOP") || normalized.Contains("PLENUM") || normalized.Contains("ZIGZAC"))
            return "HOP_PLENUM";
        if (normalized.Contains("CHAC"))
            return "CHAC";
        if (normalized.Contains("ONG THANG") || normalized.Contains("ONG GIO THANG") || normalized.Contains("ONG"))
            return "ONG_THANG";

        throw new InvalidOperationException($"Chua co cong thuc cho nhom san pham: {tenNhom}");
    }

    private static string NormalizeKey(string value)
    {
        var decomposed = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);

        foreach (var c in decomposed)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(c);
            if (category != UnicodeCategory.NonSpacingMark)
                builder.Append(c == 'd' || c == 'D' || c == 'đ' || c == 'Đ' ? 'D' : char.ToUpperInvariant(c));
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

}
