namespace OngGio.Application.Calculation.Formulas;

public class OngThangAreaFormula : IAreaFormula
{
    public string NhomKey => "ONG_THANG";

    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var sSx1Cai = CalculateStraightArea(input);

        return new AreaFormulaResult(0m, sSx1Cai / 2m, sSx1Cai / 2m, sSx1Cai, "XAC_NHAN");
    }

    public static decimal CalculateStraightArea(AreaFormulaInput input)
    {
        var length = input.L > 0 ? input.L : 1000m;
        var pieceCount = input.Get("phan_manh", 1m);
        var lengthWithAllowance = length + 100m;

        if (pieceCount >= 4m)
            return 2m * (input.W + input.H + 152m) * lengthWithAllowance / 1_000_000m;

        var seamAllowance = pieceCount >= 2m ? 82m : 41m;
        return (2m * (input.W + input.H) + seamAllowance) * lengthWithAllowance / 1_000_000m;
    }
}
