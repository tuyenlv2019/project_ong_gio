using OngGio.Application.Calculation;

namespace OngGio.Application.Tests;

public class DbFormulaEvaluatorTests
{
    private readonly DbFormulaEvaluator _evaluator = new();

    private static Dictionary<string, decimal> Params(params (string Key, decimal Value)[] items)
    {
        var dict = new Dictionary<string, decimal>(StringComparer.Ordinal);
        foreach (var (key, value) in items)
            dict[key] = value;
        return dict;
    }

    [Fact]
    public void Co90_TinhTheoViDuDong5()
    {
        var result = _evaluator.Evaluate(StandardProductFormulas.Co, Params(
            ("W", 300m),
            ("H", 300m),
            ("r", 150m)));

        Assert.Equal(0.927248m, result, 6);
    }

    [Fact]
    public void Giam_TinhTheoViDuDong17()
    {
        var result = _evaluator.Evaluate(StandardProductFormulas.Giam, Params(
            ("W", 900m),
            ("H", 500m),
            ("L", 500m)));

        Assert.Equal(1.7712m, result, 4);
    }

    [Fact]
    public void OngThangHaiManh_TinhTheoViDuDong28()
    {
        var result = _evaluator.Evaluate(StandardProductFormulas.OngThang, Params(
            ("W", 300m),
            ("H", 500m),
            ("L", 1000m),
            ("phan_manh", 2m)));

        Assert.Equal(1.8502m, result, 4);
    }

    [Fact]
    public void OngBitDau_TinhTheoViDuDong28()
    {
        var input = Params(("W", 300m), ("H", 500m), ("L", 1000m), ("phan_manh", 2m));

        var oneCap = _evaluator.Evaluate(StandardProductFormulas.OngBitMotDau, input);
        var twoCaps = _evaluator.Evaluate(StandardProductFormulas.OngBitHaiDau, input);

        Assert.Equal(2.013256m, oneCap, 6);
        Assert.Equal(2.176312m, twoCaps, 6);
    }

    [Fact]
    public void Bz_TinhTheoViDuDong35()
    {
        var result = _evaluator.Evaluate(StandardProductFormulas.Bz, Params(
            ("W", 250m),
            ("H", 500m),
            ("L", 800m),
            ("DO_LECH", 200m)));

        Assert.Equal(2.1608m, result, 4);
    }

    [Fact]
    public void TeCutDeu_TinhTheoViDuDong40()
    {
        var result = _evaluator.Evaluate(StandardProductFormulas.TeCut, Params(
            ("W", 300m),
            ("H", 300m),
            ("r", 150m),
            ("Wmax", 300m)));

        Assert.Equal(1.487455m, result, 6);
    }

    [Fact]
    public void TeRe_TinhTheoViDuDong65()
    {
        var result = _evaluator.Evaluate(StandardProductFormulas.TeRe, Params(
            ("W", 300m),
            ("H", 200m),
            ("L", 520m),
            ("Wp", 300m)));

        Assert.Equal(1.33744m, result, 5);
    }

    [Fact]
    public void HopPlenum_TinhTheoViDuDong71()
    {
        var result = _evaluator.Evaluate(StandardProductFormulas.HopPlenum, Params(
            ("W", 400m),
            ("H", 400m),
            ("L", 300m),
            ("SO_LO", 1m),
            ("D", 200m)));

        Assert.Equal(0.747056m, result, 6);
    }

    [Fact]
    public void ChanRe_TinhTheoViDuDong81()
    {
        var result = _evaluator.Evaluate(StandardProductFormulas.ChanRe, Params(
            ("W", 670m),
            ("H", 670m),
            ("L", 200m)));

        Assert.Equal(0.859637m, result, 6);
    }

    [Fact]
    public void Chac_TinhTheoViDuDong96()
    {
        var result = _evaluator.Evaluate(StandardProductFormulas.Chac, Params(
            ("Wmax", 300m),
            ("R", 200m),
            ("W3", 200m),
            ("H", 200m),
            ("L", 500m)));

        Assert.Equal(1.446672m, result, 6);
    }
}
