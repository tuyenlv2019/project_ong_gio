namespace OngGio.Application.Abstractions;

public interface IAuthService
{
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
