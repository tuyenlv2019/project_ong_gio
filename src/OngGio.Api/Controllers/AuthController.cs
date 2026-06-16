using Microsoft.AspNetCore.Mvc;
using OngGio.Application.Abstractions;

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

    public AuthController(IAuthService authService, ICaptchaService captchaService)
    {
        _authService = authService;
        _captchaService = captchaService;
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
}

public record LoginRequest(string TenDangNhap, string MatKhau, string CaptchaToken, string CaptchaValue);
