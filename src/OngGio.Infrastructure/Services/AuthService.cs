using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OngGio.Application.Abstractions;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;
using OngGio.Infrastructure.Security;

namespace OngGio.Infrastructure.Services;

/// <summary>
/// Service đăng nhập: kiểm tra user, hash mật khẩu và sinh JWT.
/// </summary>
public class AuthService : IAuthService
{
    private readonly OngGioDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthService(OngGioDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    /// <summary>
    /// Xác thực tài khoản và trả về kết quả đăng nhập.
    /// </summary>
    /// <param name="tenDangNhap">Tên đăng nhập.</param>
    /// <param name="matKhau">Mật khẩu người dùng.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Kết quả đăng nhập kèm JWT nếu hợp lệ.</returns>
    public async Task<AuthResult> LoginAsync(string tenDangNhap, string matKhau, CancellationToken ct = default)
    {
        var user = _db.NguoiDungs.FirstOrDefault(x => x.TenDangNhap == tenDangNhap);
        if (user == null)
            return new AuthResult(false, "Tên đăng nhập không tồn tại", null, null, null, null, null);

        if (!user.DangHoatDong)
            return new AuthResult(false, "Tài khoản bị khóa", null, null, null, null, null);

        if (!PasswordHasher.Verify(matKhau, user.MatKhauHash))
            return new AuthResult(false, "Mật khẩu không chính xác", null, null, null, null, null);

        var token = GenerateJwtToken(user);

        return new AuthResult(
            true,
            "Đăng nhập thành công",
            user.Id,
            token,
            user.TenDangNhap,
            user.HoTen,
            user.VaiTro
        );
    }

    /// <summary>
    /// Sinh JWT token chứa thông tin cơ bản của user.
    /// </summary>
    /// <param name="user">Người dùng đã được xác thực.</param>
    /// <returns>Chuỗi JWT.</returns>
    private string GenerateJwtToken(NguoiDung user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));
        var signingCredentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("id", user.Id.ToString()),
            new Claim("tenDangNhap", user.TenDangNhap),
            new Claim("hoTen", user.HoTen),
            new Claim("vaiTro", user.VaiTro)
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(int.Parse(jwtSettings["ExpiresInHours"]!)),
            signingCredentials: signingCredentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
