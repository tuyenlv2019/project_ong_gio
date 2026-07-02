using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OngGio.Application.Services;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;
using OngGio.Infrastructure.Security;
using OngGio.Infrastructure.Services;

namespace OngGio.Api.Controllers;

/// <summary>
/// Controller cung cấp số liệu dashboard và CRUD người dùng nội bộ.
/// </summary>
[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboard;

    public DashboardController(DashboardService dashboard) => _dashboard = dashboard;

    /// <summary>
    /// Lấy toàn bộ thống kê tổng quan cho dashboard.
    /// </summary>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Số liệu dashboard.</returns>
    [HttpGet]
    public async Task<IActionResult> GetStats(CancellationToken ct) =>
        Ok(await _dashboard.GetStatsAsync(ct));
}

/// <summary>
/// Controller quản lý người dùng nội bộ của hệ thống.
/// </summary>
[Authorize(Policy = "AdminOnly")]
[ApiController]
[Route("api/nguoi-dung")]
public class NguoiDungController : ControllerBase
{
    private readonly OngGioDbContext _db;

    public NguoiDungController(OngGioDbContext db) => _db = db;

    /// <summary>
    /// Lấy danh sách người dùng và thông tin cơ bản.
    /// </summary>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Danh sách người dùng.</returns>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _db.NguoiDungs
            .OrderBy(x => x.HoTen)
            .ThenBy(x => x.Id)
            .ToListAsync(ct));

    /// <summary>
    /// Tạo user mới.
    /// </summary>
    /// <param name="request">Dữ liệu user cần tạo.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>User vừa tạo.</returns>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] NguoiDungRequest request, CancellationToken ct)
    {
        var user = new NguoiDung
        {
            TenDangNhap = request.TenDangNhap,
            HoTen = request.HoTen,
            MatKhauHash = PasswordHasher.Hash(request.MatKhau),
            VaiTro = request.VaiTro ?? "NHAN_VIEN",
            DangHoatDong = request.DangHoatDong
        };
        _db.NguoiDungs.Add(user);
        await _db.SaveChangesAsync(ct);
        return Ok(new { user.Id, user.TenDangNhap, user.HoTen, user.VaiTro, user.DangHoatDong });
    }

    /// <summary>
    /// Cập nhật thông tin user theo id.
    /// </summary>
    /// <param name="id">Mã user.</param>
    /// <param name="request">Dữ liệu cập nhật.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>User sau khi cập nhật.</returns>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] NguoiDungRequest request, CancellationToken ct)
    {
        var user = await _db.NguoiDungs.FindAsync([id], ct);
        if (user is null) return NotFound();

        user.TenDangNhap = request.TenDangNhap;
        user.HoTen = request.HoTen;
        user.VaiTro = request.VaiTro ?? user.VaiTro;
        user.DangHoatDong = request.DangHoatDong;
        if (!string.IsNullOrWhiteSpace(request.MatKhau))
            user.MatKhauHash = PasswordHasher.Hash(request.MatKhau);

        await _db.SaveChangesAsync(ct);
        return Ok(new { user.Id, user.TenDangNhap, user.HoTen, user.VaiTro, user.DangHoatDong });
    }

    /// <summary>
    /// Xóa user theo id.
    /// </summary>
    /// <param name="id">Mã user.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>NoContent nếu xóa thành công, 404 nếu không tìm thấy.</returns>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var user = await _db.NguoiDungs.FindAsync([id], ct);
        if (user is null) return NotFound();
        _db.NguoiDungs.Remove(user);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>
    /// Admin đặt lại mật khẩu cho user khác.
    /// </summary>
    /// <param name="id">Mã user cần reset mật khẩu.</param>
    /// <param name="request">Mật khẩu mới.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Thông báo kết quả.</returns>
    [HttpPatch("{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.MatKhauMoi) || request.MatKhauMoi.Length < 6)
            return BadRequest(new { message = "Mật khẩu mới phải có ít nhất 6 ký tự" });

        if (request.MatKhauMoi != request.XacNhanMatKhauMoi)
            return BadRequest(new { message = "Mật khẩu xác nhận không khớp" });

        var user = await _db.NguoiDungs.FindAsync([id], ct);
        if (user is null) return NotFound();

        user.MatKhauHash = PasswordHasher.Hash(request.MatKhauMoi);
        await _db.SaveChangesAsync(ct);

        return Ok(new { success = true, message = $"Đã reset mật khẩu cho {user.TenDangNhap}" });
    }
}

public record NguoiDungRequest(
    string TenDangNhap,
    string HoTen,
    string? MatKhau,
    string? VaiTro,
    bool DangHoatDong = true);

public record ResetPasswordRequest(string MatKhauMoi, string XacNhanMatKhauMoi);
