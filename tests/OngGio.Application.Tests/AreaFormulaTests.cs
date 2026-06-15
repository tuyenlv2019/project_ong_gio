using OngGio.Application.Calculation.Formulas;

namespace OngGio.Application.Tests;

public class AreaFormulaTests
{
    private static AreaFormulaInput Input(
        decimal w,
        decimal h,
        decimal rInner = 0m,
        decimal rOuter = 0m,
        decimal l = 0m,
        IReadOnlyDictionary<string, decimal>? parameters = null)
    {
        return new AreaFormulaInput(w, h, rOuter, rInner, l, 8m, 50m, 30m, parameters ?? new Dictionary<string, decimal>());
    }

    [Fact]
    public void Co90_TinhTheoViDuDong5()
    {
        var result = new Co90AreaFormula().Calculate(Input(w: 300m, h: 300m, rInner: 150m));

        Assert.Equal(0.516128m, result.SMatCongSx);
        Assert.Equal(0.12078m, result.SThanhNhoSx);
        Assert.Equal(0.29034m, result.SThanhLoanSx);
        Assert.Equal(0.927248m, result.SSx1Cai);
    }

    [Fact]
    public void Co45_DungCongThucCoTrongSheet1()
    {
        var result = new Co45AreaFormula().Calculate(Input(w: 300m, h: 300m, rInner: 150m));

        Assert.Equal(0.927248m, result.SSx1Cai);
    }

    [Fact]
    public void Giam_TinhTheoViDuDong17()
    {
        var result = new GiamAreaFormula().Calculate(Input(w: 900m, h: 500m, l: 500m));

        Assert.Equal(1.0992m, result.SThanhNhoSx);
        Assert.Equal(0.672m, result.SThanhLoanSx);
        Assert.Equal(1.7712m, result.SSx1Cai);
    }

    [Fact]
    public void OngThangHaiManh_TinhTheoViDuDong28()
    {
        var result = new OngThangAreaFormula().Calculate(Input(
            w: 300m,
            h: 500m,
            l: 1000m,
            parameters: new Dictionary<string, decimal> { ["phan_manh"] = 2m }));

        Assert.Equal(1.8502m, result.SSx1Cai);
    }

    [Fact]
    public void OngBitDau_TinhTheoViDuDong28()
    {
        var input = Input(
            w: 300m,
            h: 500m,
            l: 1000m,
            parameters: new Dictionary<string, decimal> { ["phan_manh"] = 2m });

        var oneCap = new OngBitMotDauAreaFormula().Calculate(input);
        var twoCaps = new OngBitHaiDauAreaFormula().Calculate(input);

        Assert.Equal(2.013256m, oneCap.SSx1Cai);
        Assert.Equal(2.176312m, twoCaps.SSx1Cai);
    }

    [Fact]
    public void Bz_TinhTheoViDuDong35()
    {
        var result = new BzAreaFormula().Calculate(Input(
            w: 250m,
            h: 500m,
            l: 800m,
            parameters: new Dictionary<string, decimal> { ["DO_LECH"] = 200m }));

        Assert.Equal(0.9288m, result.SThanhNhoSx);
        Assert.Equal(1.232m, result.SThanhLoanSx);
        Assert.Equal(2.1608m, result.SSx1Cai);
    }

    [Fact]
    public void TeCutDeu_TinhTheoViDuDong40()
    {
        var result = new TeCutAreaFormula().Calculate(Input(w: 300m, h: 300m, rInner: 150m));

        Assert.Equal(0.9324m, result.SMatCongSx);
        Assert.Equal(0.313495m, result.SThanhNhoSx, 6);
        Assert.Equal(0.24156m, result.SThanhLoanSx);
        Assert.Equal(1.487455m, result.SSx1Cai, 6);
    }

    [Fact]
    public void TeRe_TinhTheoViDuDong65()
    {
        var result = new TeReAreaFormula().Calculate(Input(
            w: 300m,
            h: 200m,
            l: 520m,
            parameters: new Dictionary<string, decimal> { ["Wp"] = 300m }));

        Assert.Equal(0.84032m, result.SMatCongSx);
        Assert.Equal(0.38389m, result.SThanhNhoSx);
        Assert.Equal(0.11323m, result.SThanhLoanSx);
        Assert.Equal(1.33744m, result.SSx1Cai);
    }

    [Fact]
    public void HopPlenum_TinhTheoViDuDong71()
    {
        var result = new HopPlenumAreaFormula().Calculate(Input(
            w: 400m,
            h: 400m,
            l: 300m,
            parameters: new Dictionary<string, decimal>
            {
                ["SO_LO"] = 1m,
                ["D"] = 200m
            }));

        Assert.Equal(0.03454m, result.SMatCongSx);
        Assert.Equal(0.53946m, result.SThanhNhoSx);
        Assert.Equal(0.173056m, result.SThanhLoanSx);
        Assert.Equal(0.747056m, result.SSx1Cai);
    }

    [Fact]
    public void ChanRe_TinhTheoViDuDong81()
    {
        var result = new ChanReAreaFormula().Calculate(Input(w: 670m, h: 670m, l: 200m));

        Assert.Equal(0.4279m, result.SMatCongSx);
        Assert.Equal(0.230987m, result.SThanhNhoSx, 6);
        Assert.Equal(0.20075m, result.SThanhLoanSx);
        Assert.Equal(0.859637m, result.SSx1Cai, 6);
    }

    [Fact]
    public void Chac_TinhTheoViDuDong96()
    {
        var result = new ChacAreaFormula().Calculate(Input(
            w: 300m,
            h: 200m,
            rOuter: 200m,
            l: 500m,
            parameters: new Dictionary<string, decimal>
            {
                ["Wmax"] = 300m,
                ["W3"] = 200m
            }));

        Assert.Equal(0.96m, result.SMatCongSx);
        Assert.Equal(0.21528m, result.SThanhNhoSx);
        Assert.Equal(0.271392m, result.SThanhLoanSx);
        Assert.Equal(1.446672m, result.SSx1Cai);
    }
}
