namespace OngGio.Application.Calculation.Formulas;

public class Co45AreaFormula : IAreaFormula
{
    public string NhomKey => "CO_45";

    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var margin = AreaFormulaHelper.Margin(input.Mi8, input.Tdc);
        var rEff = input.R + margin;

        // Co 45°: diện tích mặt cong ~ 1/2 so với Co 90°
        var sMatCongSx = rEff * rEff / 1_000_000m;

        var sideLength = input.L > 0 ? input.L : rEff;
        var sThanhNhoSx = AreaFormulaHelper.SideWall(input.H, margin, sideLength, input.Mi8);
        var sThanhLoanSx = AreaFormulaHelper.SideWall(input.W, margin, sideLength, input.Mi8);

        return AreaFormulaHelper.BuildResult(sMatCongSx, sThanhNhoSx, sThanhLoanSx);
    }
}
