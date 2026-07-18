using OngGio.Domain.Entities;

namespace OngGio.Application.Calculation;

/// <summary>
/// Quy tắc tự động xác định số mảnh theo chu vi tiết diện sản phẩm.
/// </summary>
public static class PhanManhRule
{
    public const string ParameterName = "phan_manh";
    public const decimal PerimeterThresholdMm = 1600m;

    public static bool IsParameter(string? name) =>
        string.Equals(name?.Trim(), ParameterName, StringComparison.OrdinalIgnoreCase);

    public static bool AppliesTo(IReadOnlyList<ThamSoCoDinh> parameters) =>
        parameters.Any(parameter => IsParameter(parameter.TenThamSo));

    public static decimal Calculate(decimal w, decimal h) =>
        2m * w + 2m * h > PerimeterThresholdMm ? 2m : 1m;

    public static Dictionary<string, decimal> Normalize(
        IReadOnlyDictionary<string, decimal>? parameters,
        decimal w,
        decimal h)
    {
        var normalized = parameters is null
            ? new Dictionary<string, decimal>(StringComparer.Ordinal)
            : new Dictionary<string, decimal>(parameters, StringComparer.Ordinal);

        foreach (var key in normalized.Keys.Where(IsParameter).ToArray())
            normalized.Remove(key);

        normalized[ParameterName] = Calculate(w, h);
        return normalized;
    }
}
