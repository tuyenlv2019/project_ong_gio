using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OngGio.Application.Services;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;
using OngGio.Infrastructure.Security;
using OngGio.Infrastructure.Services;

namespace OngGio.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboard;

    public DashboardController(DashboardService dashboard) => _dashboard = dashboard;

    [HttpGet]
    public async Task<IActionResult> GetStats(CancellationToken ct) =>
        Ok(await _dashboard.GetStatsAsync(ct));
}

[ApiController]
[Route("api/nguoi-dung")]
public class NguoiDungController : ControllerBase
{
    private readonly OngGioDbContext _db;

    public NguoiDungController(OngGioDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var users = await _db.NguoiDungs.OrderBy(x => x.HoTen).ToListAsync(ct);
        return Ok(users.Select(u => new { u.Id, u.TenDangNhap, u.HoTen, u.VaiTro, u.DangHoatDong, u.CreatedAt }));
    }

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

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var user = await _db.NguoiDungs.FindAsync([id], ct);
        if (user is null) return NotFound();
        _db.NguoiDungs.Remove(user);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record NguoiDungRequest(
    string TenDangNhap,
    string HoTen,
    string? MatKhau,
    string? VaiTro,
    bool DangHoatDong = true);
