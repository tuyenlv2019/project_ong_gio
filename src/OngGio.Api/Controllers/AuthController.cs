using Microsoft.AspNetCore.Mvc;
using OngGio.Application.Abstractions;

namespace OngGio.Api.Controllers;

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

    [HttpGet("captcha")]
    public async Task<IActionResult> GetCaptcha(CancellationToken ct)
    {
        var captcha = await _captchaService.CreateCaptchaAsync(ct);
        return Ok(new { token = captcha.Token, imageBase64 = captcha.ImageBase64 });
    }

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
