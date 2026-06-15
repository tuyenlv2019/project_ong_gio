namespace OngGio.Application.Calculation.Formulas;

public class ChanReAreaFormula : IAreaFormula
{
    public string NhomKey => "CHAN_RE";

    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var length = input.L > 0 ? input.L : 200m;
        var sMatHinhGiay = (input.W + 108m) * (length + 75m) * 2m / 1_000_000m;
        var sMui = (100m * 1.4142m + length - 25m) * (input.H + 60m) / 1_000_000m;
        var sLung = (length + 75m) * (input.H + 60m) / 1_000_000m;

        return AreaFormulaHelper.BuildResult(sMatHinhGiay, sMui, sLung);
    }
}
