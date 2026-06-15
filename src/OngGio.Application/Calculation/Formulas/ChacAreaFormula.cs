namespace OngGio.Application.Calculation.Formulas;

public class ChacAreaFormula : IAreaFormula
{
    public string NhomKey => "CHAC";

    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var wMax = input.Get("Wmax", input.W);
        var w3 = input.Get("W3", input.Get("w3", input.W));
        var length = input.L > 0 ? input.L : 1000m;
        var radius = input.R;

        var sHaiMatChac = (wMax + 2m * radius + 100m) * (length + 100m) * 2m / 1_000_000m;
        var sHaiMatCanhWmax = (3.14m * radius / 2m + 100m) * (input.H + 60m) * 2m / 1_000_000m;
        var sHaiMatCanhW2 = (1.57m * radius + 100m + w3 / 2m) * (input.H + 64m) * 2m / 1_000_000m;

        return new AreaFormulaResult(sHaiMatChac, sHaiMatCanhWmax, sHaiMatCanhW2, sHaiMatChac + sHaiMatCanhWmax + sHaiMatCanhW2, "XAC_NHAN");
    }
}
