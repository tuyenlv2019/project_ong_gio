namespace OngGio.Application.Calculation.Formulas;

public class ChanReAreaFormula : IAreaFormula
{
    public string NhomKey => "CHAN_RE";

    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var margin = AreaFormulaHelper.Margin(input.Mi8, input.Tdc);
        var mainLength = input.L > 0 ? input.L : 400m;
        var branchLength = input.R > 0 ? input.R : input.W;
        var perimeter = (input.W + input.H + margin * 2m) * 2m;

        // Chân rẽ: ống chính + nhánh vuông góc
        var sMain = perimeter * mainLength / 1_000_000m;
        var sBranch = (input.W + margin) * (branchLength + input.MiZ) / 1_000_000m * 2m;

        return AreaFormulaHelper.BuildResult(sBranch, sMain / 2m, sMain / 2m);
    }
}
