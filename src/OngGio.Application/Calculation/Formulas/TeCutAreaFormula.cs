namespace OngGio.Application.Calculation.Formulas;

/// <summary>
/// Công thức diện tích cho tê cắt.
/// </summary>
public class TeCutAreaFormula : IAreaFormula
{
    public string NhomKey => "TE_CUT";

    /// <summary>
    /// Tính diện tích cho tê cắt.
    /// </summary>
    /// <param name="input">Dữ liệu đầu vào.</param>
    /// <returns>Kết quả diện tích.</returns>
    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var wMax = input.Get("Wmax", 0m);
        var radius = input.r > 0 ? input.r : input.Get("r_max", input.Get("r(max)", 0m));
        var c1c2 = (decimal)Math.Sqrt((double)(2m * input.W * input.W + 4m * radius * input.W + 4m * radius * radius)) + 100m;
        var c3 = 100m + 3.14m * radius / 2m;
        var rongT = 100m + input.W + 2m * radius;
        var caoT = wMax > input.W ? radius + wMax : 158m + radius + input.W;

        var sMatT = rongT * (caoT + 58m) * 2m / 1_000_000m;
        var sMatCongTren = (c1c2 + 100m) * (input.H + 60m) / 1_000_000m;
        var sMatCongBen = c3 * (input.H + 60m) * 2m / 1_000_000m;

        return new AreaFormulaResult(sMatT, sMatCongTren, sMatCongBen, sMatT + sMatCongTren + sMatCongBen, "XAC_NHAN");
    }
}
