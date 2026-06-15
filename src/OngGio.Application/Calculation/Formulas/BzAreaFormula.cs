namespace OngGio.Application.Calculation.Formulas;

public class BzAreaFormula : IAreaFormula
{
    public string NhomKey => "BZ";

    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var length = input.L > 0 ? input.L : 1000m;
        var offset = input.Get("DO_LECH", input.Get("do_lech", input.R));
        var matZ = (2m * input.W + 16m) * (length + 100m) * 2m / 1_000_000m;
        var matLuon = (length + 100m + offset) * (input.H + 60m) * 2m / 1_000_000m;

        return new AreaFormulaResult(0m, matZ, matLuon, matZ + matLuon, "XAC_NHAN");
    }
}
