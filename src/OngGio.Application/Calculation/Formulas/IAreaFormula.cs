using OngGio.Application.Calculation;

namespace OngGio.Application.Calculation.Formulas;

public interface IAreaFormula
{
    string NhomKey { get; }
    AreaFormulaResult Calculate(AreaFormulaInput input);
}

public record AreaFormulaInput(
    decimal W,
    decimal H,
    decimal R,
    decimal r,
    decimal L,
    decimal Mi8,
    decimal Tdc,
    decimal MiZ);

public record AreaFormulaResult(
    decimal SMatCongSx,
    decimal SThanhNhoSx,
    decimal SThanhLoanSx,
    decimal SSx1Cai,
    string TrangThaiCongThuc);
