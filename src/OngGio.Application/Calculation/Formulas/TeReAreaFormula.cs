namespace OngGio.Application.Calculation.Formulas;

/// <summary>
/// Công thức diện tích cho tê rẽ.
/// </summary>
public class TeReAreaFormula : IAreaFormula
{
    public string NhomKey => "TE_RE";

    /// <summary>
    /// Tính diện tích cho tê rẽ.
    /// </summary>
    /// <param name="input">Dữ liệu đầu vào.</param>
    /// <returns>Kết quả diện tích.</returns>
    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var branchWidth = input.Get("W'", input.Get("Wp", input.Get("W_branch", input.W)));
        var radius = branchWidth / 2m;
        var caoT = input.L > 0 ? input.L : 520m;
        var c1 = 250m + 3.14m * (radius + branchWidth) / 2m;
        var c2 = 3.14m * radius / 2m + 200m;
        var rongT = input.W + radius + branchWidth + 58m;

        var sMatR = rongT * caoT * 2m / 1_000_000m;
        var sMatCongTren = c1 * (input.H + 60m) / 1_000_000m;
        var sMatCongBen = c2 * (input.H + 60m) / 1_000_000m;
        var sMatThang = caoT * (input.H + 60m) / 1_000_000m;

        return new AreaFormulaResult(sMatR, sMatCongTren + sMatThang, sMatCongBen, sMatR + sMatCongTren + sMatCongBen + sMatThang, "XAC_NHAN");
    }
}
