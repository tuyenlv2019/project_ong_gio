namespace OngGio.Application.Calculation.Formulas;

/// <summary>
/// Công thức diện tích cho nhóm giảm / côn thu.
/// </summary>
public class GiamAreaFormula : IAreaFormula
{
    public string NhomKey => "GIAM";

    /// <summary>
    /// Tính diện tích cho nhóm giảm / côn thu.
    /// </summary>
    /// <param name="input">Dữ liệu đầu vào.</param>
    /// <returns>Kết quả diện tích.</returns>
    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var length = input.L > 0 ? input.L : 300m;
        var sSx1 = (input.W + 16m) * (length + 100m) * 2m / 1_000_000m;
        var sSx2 = (input.H + 60m) * (length + 100m) * 2m / 1_000_000m;

        return AreaFormulaHelper.BuildResult(0m, sSx1, sSx2);
    }
}
