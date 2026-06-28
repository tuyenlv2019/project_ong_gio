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
        var orders = await _db.BaoGias
            .AsNoTracking()
            .Select(x => new { x.TrangThai, x.TongTienSauThue })
            .ToListAsync(ct);

        var normalizedOrders = orders
            .Select(x => (Status: OrderStatusNormalizer.Normalize(x.TrangThai), x.TongTienSauThue))
            .ToList();

        var materialTotal = await _db.ChiTietBaoGias.AsNoTracking().SumAsync(x => x.ThanhTienTon, ct);
        var revenueTotal = normalizedOrders
            .Where(x => x.Status == OrderStatusNormalizer.HoanThanh)
            .Sum(x => x.TongTienSauThue);

        return new DashboardStats(
            normalizedOrders.Count,
            normalizedOrders.Count(x => x.Status == OrderStatusNormalizer.ChuaXuLy),
            normalizedOrders.Count(x => x.Status == OrderStatusNormalizer.DangXuLy),
            normalizedOrders.Count(x => x.Status == OrderStatusNormalizer.HoanThanh),
            materialTotal,
            revenueTotal,
            await _db.NhomSanPhams.CountAsync(ct),
            await _db.LoaiTons.CountAsync(ct),
            await _db.NguoiDungs.CountAsync(ct));
    }
}
