namespace OngGio.Infrastructure;

/// <summary>
/// Chuẩn hóa mã trạng thái đơn hàng trước khi lưu hoặc thống kê.
/// </summary>
public static class OrderStatusNormalizer
{
    public const string ChuaXuLy = "CHUA_XU_LY";
    public const string DangXuLy = "DANG_XU_LY";
    public const string HoanThanh = "HOAN_THANH";

    public static string Normalize(string? trangThai)
    {
        if (string.IsNullOrWhiteSpace(trangThai))
            return ChuaXuLy;

        var value = trangThai.Trim().ToUpperInvariant();
        return value switch
        {
            ChuaXuLy or DangXuLy or HoanThanh => value,
            _ => ChuaXuLy
        };
    }
}
