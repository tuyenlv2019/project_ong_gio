using OngGio.Application.Calculation;

namespace OngGio.Application.Calculation.Formulas;

/// <summary>
/// Interface chuẩn cho mọi công thức diện tích.
/// </summary>
public interface IAreaFormula
{
    /// <summary>
    /// Mã nhóm sản phẩm mà công thức này hỗ trợ.
    /// </summary>
    string NhomKey { get; }

    /// <summary>
    /// Tính toán diện tích theo dữ liệu đầu vào.
    /// </summary>
    /// <param name="input">Dữ liệu đầu vào của công thức.</param>
    /// <returns>Kết quả tính toán diện tích.</returns>
    AreaFormulaResult Calculate(AreaFormulaInput input);
}

/// <summary>
/// Dữ liệu đầu vào dùng chung cho công thức diện tích.
/// </summary>
public record AreaFormulaInput(
    decimal W,
    decimal H,
    decimal R,
    decimal r,
    decimal L,
    IReadOnlyDictionary<string, decimal> Parameters)
{
    /// <summary>
    /// Lấy giá trị tham số theo key, trả về mặc định nếu không có.
    /// </summary>
    /// <param name="key">Tên tham số.</param>
    /// <param name="defaultValue">Giá trị mặc định nếu không tìm thấy.</param>
    /// <returns>Giá trị tham số hoặc giá trị mặc định.</returns>
    public decimal Get(string key, decimal defaultValue = 0m) =>
        Parameters.TryGetValue(key, out var value) ? value : defaultValue;
}

/// <summary>
/// Kết quả đầu ra của công thức diện tích.
/// </summary>
public record AreaFormulaResult(
    decimal SMatCongSx,
    decimal SThanhNhoSx,
    decimal SThanhLoanSx,
    decimal SSx1Cai,
    string TrangThaiCongThuc);
