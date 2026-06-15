namespace OngGio.Application.Calculation.Formulas;

public class GiamAreaFormula : IAreaFormula
{
    public string NhomKey => "GIAM";

    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        var margin = AreaFormulaHelper.Margin(input.Mi8, input.Tdc);
        var length = input.L > 0 ? input.L : 300m;
        var connection = input.MiZ;

        // Giảm tiết diện: chu vi trung bình × chiều dài (có bù mí Z hai đầu)
        var perimeter = (input.W + input.H + margin * 2m) * 2m;
        var sSx1Cai = perimeter * (length + connection * 2m) / 1_000_000m;

        return AreaFormulaHelper.BuildResult(0m, sSx1Cai / 2m, sSx1Cai / 2m);
    }
}
