namespace OngGio.Application.Calculation.Formulas;

public class OngThangAreaFormula : IAreaFormula
{
    public string NhomKey => "ONG_THANG";

    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var margin = input.Mi8 + input.Tdc;
        var length = input.L > 0 ? input.L : 1000m;
        var perimeter = (input.W + input.H + margin * 2m) * 2m;
        var sSx1Cai = perimeter * length / 1_000_000m;

        return new AreaFormulaResult(0m, sSx1Cai / 2m, sSx1Cai / 2m, sSx1Cai, "XAC_NHAN");
    }
}
