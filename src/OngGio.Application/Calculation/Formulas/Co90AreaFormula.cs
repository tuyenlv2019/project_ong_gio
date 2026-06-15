namespace OngGio.Application.Calculation.Formulas;

public class Co90AreaFormula : IAreaFormula
{
    public string NhomKey => "CO_90";

    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var margin = AreaFormulaHelper.Margin(input.Mi8, input.Tdc);
        var rEff = input.R + margin;

        var sMatCongSx = rEff * rEff * 2m / 1_000_000m;

        var sideLength = input.L > 0 ? input.L : rEff;
        var sThanhNhoSx = AreaFormulaHelper.SideWall(input.H, margin, sideLength, input.Mi8);
        var sThanhLoanSx = AreaFormulaHelper.SideWall(input.W, margin, sideLength, input.Mi8);

        return AreaFormulaHelper.BuildResult(sMatCongSx, sThanhNhoSx, sThanhLoanSx);
    }
}
