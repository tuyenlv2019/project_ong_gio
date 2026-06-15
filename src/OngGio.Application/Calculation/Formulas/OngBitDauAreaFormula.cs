namespace OngGio.Application.Calculation.Formulas;

public class OngBitMotDauAreaFormula : IAreaFormula
{
    public string NhomKey => "ONG_BIT_1_DAU";

    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var ong = OngThangAreaFormula.CalculateStraightArea(input);
        var cap = (input.W + 16m) * (input.H + 16m) / 1_000_000m;
        return new AreaFormulaResult(0m, ong / 2m, ong / 2m + cap, ong + cap, "XAC_NHAN");
    }
}

public class OngBitHaiDauAreaFormula : IAreaFormula
{
    public string NhomKey => "ONG_BIT_2_DAU";

    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var ong = OngThangAreaFormula.CalculateStraightArea(input);
        var caps = 2m * (input.W + 16m) * (input.H + 16m) / 1_000_000m;
        return new AreaFormulaResult(0m, ong / 2m, ong / 2m + caps, ong + caps, "XAC_NHAN");
    }
}
