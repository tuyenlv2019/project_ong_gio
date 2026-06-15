namespace OngGio.Application.Calculation.Formulas;

internal static class AreaFormulaHelper
{
    public static decimal Margin(decimal mi8, decimal tdc) => mi8 + tdc;

    public static AreaFormulaResult BuildResult(
        decimal sMatCongSx,
        decimal sThanhNhoSx,
        decimal sThanhLoanSx,
        string trangThai = "XAC_NHAN")
    {
        var sSx1Cai = sMatCongSx + sThanhNhoSx + sThanhLoanSx;
        return new AreaFormulaResult(sMatCongSx, sThanhNhoSx, sThanhLoanSx, sSx1Cai, trangThai);
    }

    public static decimal SideWall(decimal dimension, decimal margin, decimal length, decimal mi8) =>
        (dimension + margin) * (length + mi8) / 1_000_000m;
}
