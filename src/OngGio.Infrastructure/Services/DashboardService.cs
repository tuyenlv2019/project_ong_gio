using Microsoft.EntityFrameworkCore;
using OngGio.Application.Services;
using OngGio.Infrastructure.Persistence;

namespace OngGio.Infrastructure.Services;

/// <summary>
/// Service lấy số liệu tổng quan cho dashboard.
/// </summary>
public class DashboardService
{
    private readonly OngGioDbContext _db;

    public DashboardService(OngGioDbContext db) => _db = db;

    /// <summary>
    /// Tính và trả về số liệu dashboard từ database.
    /// </summary>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Dữ liệu thống kê dashboard.</returns>
    public async Task<DashboardStats> GetStatsAsync(CancellationToken ct = default)
    {
        var orders = await _db.BaoGias.AsNoTracking().ToListAsync(ct);
        var materialTotal = await _db.ChiTietBaoGias.AsNoTracking().SumAsync(x => x.ThanhTienTon, ct);

        return new DashboardStats(
            orders.Count,
            orders.Count(x => x.TrangThai == "DANG_XU_LY"),
            orders.Count(x => x.TrangThai == "HOAN_THANH"),
            materialTotal,
            orders.Sum(x => x.TongTienSauThue),
            await _db.NhomSanPhams.CountAsync(ct),
            await _db.LoaiTons.CountAsync(ct),
            await _db.NguoiDungs.CountAsync(ct));
    }
}
