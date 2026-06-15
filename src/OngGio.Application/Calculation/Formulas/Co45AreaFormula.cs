namespace OngGio.Application.Calculation.Formulas;

public class Co45AreaFormula : IAreaFormula
{
    public string NhomKey => "CO_45";

    public AreaFormulaResult Calculate(AreaFormulaInput input)
    {
        return Co90AreaFormula.CalculateCo(input);
    }
}
