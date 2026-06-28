using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OngGio.Application.Abstractions;
using OngGio.Infrastructure.Persistence;

namespace OngGio.Api.Controllers;

/// <summary>
/// Controller xác thực, dùng để phát captcha và đăng nhập lấy JWT cho frontend.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICaptchaService _captchaService;
    private readonly OngGioDbContext _db;

    public AuthController(IAuthService authService, ICaptchaService captchaService, OngGioDbContext db)
    {
        _authService = authService;
        _captchaService = captchaService;
        _db = db;
    }

    /// <summary>
    /// Tạo một captcha mới để frontend hiển thị cho người dùng.
    /// </summary>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Token captcha và ảnh base64 của captcha.</returns>
    [HttpGet("captcha")]
    public async Task<IActionResult> GetCaptcha(CancellationToken ct)
    {
        var captcha = await _captchaService.CreateCaptchaAsync(ct);
        return Ok(new { token = captcha.Token, imageBase64 = captcha.ImageBase64 });
    }

    /// <summary>
    /// Xác thực tên đăng nhập, mật khẩu và captcha rồi trả JWT nếu hợp lệ.
    /// </summary>
    /// <param name="request">Dữ liệu đăng nhập từ client.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Token đăng nhập và thông tin user nếu thành công.</returns>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.TenDangNhap) || string.IsNullOrWhiteSpace(request.MatKhau))
            return BadRequest(new { message = "Tên đăng nhập và mật khẩu là bắt buộc" });

        if (string.IsNullOrWhiteSpace(request.CaptchaToken) || string.IsNullOrWhiteSpace(request.CaptchaValue) ||
            !await _captchaService.ValidateCaptchaAsync(request.CaptchaToken, request.CaptchaValue, ct))
        {
            return BadRequest(new { message = "Captcha không đúng" });
        }

        var result = await _authService.LoginAsync(request.TenDangNhap, request.MatKhau, ct);
        
        if (!result.Success)
            return Unauthorized(new { message = result.Message });

        return Ok(new
        {
            success = result.Success,
            token = result.Token,
            user = new
            {
                id = result.UserId,
                tenDangNhap = result.TenDangNhap,
                hoTen = result.HoTen,
                vaiTro = result.VaiTro
            }
        });
    }

    /// <summary>
    /// Đổi mật khẩu cho user đang đăng nhập.
    /// </summary>
    /// <param name="request">Mật khẩu cũ và mật khẩu mới.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Thông báo kết quả.</returns>
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.MatKhauCu) || string.IsNullOrWhiteSpace(request.MatKhauMoi))
            return BadRequest(new { message = "Vui lòng nhập đầy đủ mật khẩu" });

        if (request.MatKhauMoi != request.XacNhanMatKhauMoi)
            return BadRequest(new { message = "Mật khẩu xác nhận không khớp" });

        var userId = await ResolveUserIdForPasswordChangeAsync(request.TenDangNhap, ct);
        if (userId is null)
            return BadRequest(new { message = "Không xác định được tài khoản. Vui lòng đăng nhập lại." });

        var result = await _authService.ChangePasswordAsync(userId.Value, request.MatKhauCu, request.MatKhauMoi, ct);
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(new { success = true, message = result.Message });
    }

    private async Task<int?> ResolveUserIdForPasswordChangeAsync(string? tenDangNhap, CancellationToken ct)
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            var claimValue = User.FindFirst("id")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(claimValue, out var userIdFromToken))
                return userIdFromToken;
        }

        if (string.IsNullOrWhiteSpace(tenDangNhap))
            return null;

        var user = await _db.NguoiDungs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.TenDangNhap == tenDangNhap.Trim(), ct);

        return user?.Id;
    }
}

public record LoginRequest(string TenDangNhap, string MatKhau, string CaptchaToken, string CaptchaValue);

public record ChangePasswordRequest(string? TenDangNhap, string MatKhauCu, string MatKhauMoi, string XacNhanMatKhauMoi);
