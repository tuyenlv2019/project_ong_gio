namespace OngGio.Application.Calculation.Formulas;

public class HopPlenumAreaFormula : IAreaFormula
{
    public string NhomKey => "HOP_PLENUM";

    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var length = input.L > 0 ? input.L : 300m;
        var holes = input.Get("SO_LO", input.Get("so_lo", 1m));
        var diameter = input.Get("D", input.Get("Phi", input.R));

        var sXungQuanh = (input.W * 2m + input.H * 2m + 20m) * (length + 33m) / 1_000_000m;
        var sTren = (input.W + 16m) * (input.H + 16m) / 1_000_000m;
        var sCuron = diameter * 3.14m * 55m / 1_000_000m * holes;

        return new AreaFormulaResult(sCuron, sXungQuanh, sTren, sXungQuanh + sTren + sCuron, "XAC_NHAN");
    }
}
