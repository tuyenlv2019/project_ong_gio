namespace OngGio.Application.Calculation.Formulas;

/// <summary>
/// Công thức diện tích cho co 45 độ.
/// </summary>
public class Co45AreaFormula : IAreaFormula
{
    public string NhomKey => "CO_45";

    /// <summary>
    /// Tính diện tích cho co 45 độ.
    /// </summary>
    /// <param name="input">Dữ liệu đầu vào.</param>
    /// <returns>Kết quả diện tích.</returns>
    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        return Co90AreaFormula.CalculateCo(input);
    }
}
