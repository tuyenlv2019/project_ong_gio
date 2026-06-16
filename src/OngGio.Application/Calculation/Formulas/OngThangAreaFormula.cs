namespace OngGio.Application.Calculation.Formulas;

/// <summary>
/// Công thức diện tích cho ống thẳng.
/// </summary>
public class OngThangAreaFormula : IAreaFormula
{
    public string NhomKey => "ONG_THANG";

    /// <summary>
    /// Tính diện tích cho ống thẳng.
    /// </summary>
    /// <param name="input">Dữ liệu đầu vào.</param>
    /// <returns>Kết quả diện tích.</returns>
    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var sSx1Cai = CalculateStraightArea(input);

        return new AreaFormulaResult(0m, sSx1Cai / 2m, sSx1Cai / 2m, sSx1Cai, "XAC_NHAN");
    }

    /// <summary>
    /// Tính diện tích ống thẳng ở mức nội bộ.
    /// </summary>
    /// <param name="input">Dữ liệu đầu vào.</param>
    /// <returns>Diện tích một cái ống thẳng.</returns>
    public static decimal CalculateStraightArea(AreaFormulaInput input)
    {
        var length = input.L > 0 ? input.L : 1000m;
        var pieceCount = input.Get("phan_manh", 1m);
        var lengthWithAllowance = length + 100m;

        if (pieceCount >= 4m)
            return 2m * (input.W + input.H + 152m) * lengthWithAllowance / 1_000_000m;

        var seamAllowance = pieceCount >= 2m ? 82m : 41m;
        return (2m * (input.W + input.H) + seamAllowance) * lengthWithAllowance / 1_000_000m;
    }
}
