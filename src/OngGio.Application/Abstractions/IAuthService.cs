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

    /// <summary>
    /// Đổi mật khẩu cho user đang đăng nhập.
    /// </summary>
    /// <param name="userId">Mã user.</param>
    /// <param name="matKhauCu">Mật khẩu hiện tại.</param>
    /// <param name="matKhauMoi">Mật khẩu mới.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Kết quả đổi mật khẩu.</returns>
    Task<AuthResult> ChangePasswordAsync(int userId, string matKhauCu, string matKhauMoi, CancellationToken ct = default);
}

public record AuthResult(
    bool Success,
    string? Message,
    int? UserId,
    string? Token,
    string? TenDangNhap,
    string? HoTen,
    string? VaiTro);
