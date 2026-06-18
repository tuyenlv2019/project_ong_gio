using NCalc;

namespace OngGio.Application.Calculation;

/// <summary>
/// Đánh giá công thức ∑Ssx lưu trong DB (nhiều dòng gán biến, kết quả biến <c>Ssx</c>).
/// </summary>
public class DbFormulaEvaluator
{
    /// <summary>
    /// Tính diện tích từ chuỗi công thức và bộ tham số đầu vào.
    /// </summary>
    /// <param name="congThucDienTich">Công thức nhiều dòng hoặc một biểu thức.</param>
    /// <param name="parameters">Tham số nhập từ form đơn hàng.</param>
    /// <returns>Giá trị ∑Ssx (m²).</returns>
    public decimal Evaluate(string congThucDienTich, IReadOnlyDictionary<string, decimal> parameters)
    {
        if (string.IsNullOrWhiteSpace(congThucDienTich))
            throw new InvalidOperationException("Nhom san pham chua co cong thuc dien tich.");

        var context = new Dictionary<string, decimal>(parameters, StringComparer.Ordinal);
        var lines = congThucDienTich
            .Split(['\r', '\n', ';'], StringSplitOptions.RemoveEmptyEntries)
            .Select(line => line.Trim())
            .Where(line => line.Length > 0 && !line.StartsWith('#') && !line.StartsWith("//"))
            .ToList();

        if (lines.Count == 0)
            throw new InvalidOperationException("Cong thuc dien tich rong.");

        decimal? result = null;

        foreach (var line in lines)
        {
            var eqIndex = FindAssignmentIndex(line);
            if (eqIndex > 0)
            {
                var varName = line[..eqIndex].Trim();
                var exprText = line[(eqIndex + 1)..].Trim();
                var value = EvaluateExpression(exprText, context);
                context[varName] = value;

                if (varName.Equals("Ssx", StringComparison.OrdinalIgnoreCase) ||
                    varName.Equals("SUM", StringComparison.OrdinalIgnoreCase))
                    result = value;
            }
            else
            {
                result = EvaluateExpression(line, context);
            }
        }

        if (result is null)
        {
            if (context.TryGetValue("Ssx", out var ssx))
                return ssx;
            if (context.TryGetValue("SUM", out var sum))
                return sum;

            throw new InvalidOperationException("Cong thuc phai gan ket qua vao bien Ssx.");
        }

        return result.Value;
    }

    private static int FindAssignmentIndex(string line)
    {
        for (var i = 0; i < line.Length; i++)
        {
            if (line[i] != '=')
                continue;

            if (i > 0 && (line[i - 1] == '!' || line[i - 1] == '<' || line[i - 1] == '>' || line[i - 1] == '='))
                continue;

            return i;
        }

        return -1;
    }

    private static decimal EvaluateExpression(string expression, IReadOnlyDictionary<string, decimal> context)
    {
        try
        {
            var expr = new Expression(expression, ExpressionOptions.IgnoreCaseAtBuiltInFunctions);
            foreach (var (key, value) in context)
                expr.Parameters[key] = (double)value;

            var raw = expr.Evaluate();
            return Convert.ToDecimal(raw, System.Globalization.CultureInfo.InvariantCulture);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Loi khi tinh cong thuc '{expression}': {ex.Message}", ex);
        }
    }
}
