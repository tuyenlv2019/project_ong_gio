namespace OngGio.Application.Abstractions;

/// <summary>
/// Hợp đồng đăng nhập và phát hành token.
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Đăng nhập bằng tên đăng nhập và mật khẩu.
    /// </summary>
    /// <param name="tenDangNhap">Tên đăng nhập.</param>
    /// <param name="matKhau">Mật khẩu.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Kết quả đăng nhập.</returns>
    Task<AuthResult> LoginAsync(string tenDangNhap, string matKhau, CancellationToken ct = default);
}

public record AuthResult(
    bool Success,
    string? Message,
    int? UserId,
    string? Token,
    string? TenDangNhap,
    string? HoTen,
    string? VaiTro);
