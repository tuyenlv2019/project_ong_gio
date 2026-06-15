namespace OngGio.Application.Calculation.Formulas;

public class Co90AreaFormula : IAreaFormula
{
    public string NhomKey => "CO_90";

    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        return CalculateCo(input);
    }

    internal static AreaFormulaResult CalculateCo(AreaFormulaInput input)
    {
        var r = input.r > 0 ? input.r : Math.Max(input.R - input.W, 0m);
        var rLon = r + input.W;
        var sMatCongSx = (rLon + 58m) * (rLon + 58m) * 2m / 1_000_000m;
        var sThanhNhoSx = (3.14m * r / 2m + 100m) * (input.H + 60m) / 1_000_000m;
        var sThanhLonSx = (3.14m * rLon / 2m + 100m) * (input.H + 60m) / 1_000_000m;
        return AreaFormulaHelper.BuildResult(sMatCongSx, sThanhNhoSx, sThanhLonSx);
    }
}
