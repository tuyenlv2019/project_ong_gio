using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OngGio.Application.Services;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;

namespace OngGio.Infrastructure.Seed;

/// <summary>
/// Tạo đơn hàng demo: một báo giá gồm đủ các loại sản phẩm đã có công thức, kích thước ngẫu nhiên.
/// </summary>
internal static class SampleBaoGiaSeeder
{
    private const string DemoCustomerName = "Khách hàng demo (đủ loại SP có công thức)";

    internal static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OngGioDbContext>();

        if (await db.BaoGias.AnyAsync(b => b.TenKhachHang == DemoCustomerName))
            return;

        var nhomList = await db.NhomSanPhams
            .AsNoTracking()
            .Include(n => n.ThamSoCoDinhs)
            .Where(n => n.CongThucDienTich != null && n.CongThucDienTich != "")
            .OrderBy(n => n.TenNhom)
            .ToListAsync();

        var loaiTons = await db.LoaiTons.AsNoTracking().ToListAsync();
        if (nhomList.Count == 0 || loaiTons.Count == 0)
            return;

        var random = Random.Shared;
        var lines = new List<CreateBaoGiaLineRequest>();

        foreach (var nhom in nhomList)
        {
            if (!HasUniqueParamBindings(nhom))
                continue;

            var (w, h, thamSoNhap) = BuildRandomDimensions(nhom, random);
            var loaiTon = loaiTons[random.Next(loaiTons.Count)];
            var soLuong = random.Next(1, 6);

            lines.Add(new CreateBaoGiaLineRequest(
                NhomSanPhamId: nhom.Id,
                LoaiTonId: loaiTon.Id,
                W: w,
                H: h,
                SoLuong: soLuong,
                GiaNhanCong: random.Next(40, 201) * 1_000m,
                PhuKien: random.Next(0, 51) * 1_000m,
                ThamSoNhap: thamSoNhap.Count > 0 ? thamSoNhap : null,
                TenSanPham: BuildTenSanPham(nhom.TenNhom, w, h, thamSoNhap),
                DonViTinh: PickDonViTinh(nhom.TenNhom),
                ThueSuat: 0.08m,
                GhiChu: $"Dòng demo — {nhom.TenNhom}",
                ThanhTienTon: 0));
        }

        if (lines.Count == 0)
            return;

        var baoGiaService = scope.ServiceProvider.GetRequiredService<IBaoGiaService>();
        await baoGiaService.CreateAsync(new CreateBaoGiaRequest(
            TenKhachHang: DemoCustomerName,
            ThueSuat: 0.08m,
            Lines: lines,
            TrangThai: "CHUA_XU_LY"));
    }

    private static (decimal W, decimal H, Dictionary<string, decimal> ThamSoNhap) BuildRandomDimensions(
        NhomSanPham nhom,
        Random random)
    {
        var w = RandomDimension("W", random);
        var h = RandomDimension("H", random);
        var thamSoNhap = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

        foreach (var param in nhom.ThamSoCoDinhs.OrderBy(t => t.ThuTu).ThenBy(t => t.Id))
        {
            var name = param.TenThamSo?.Trim();
            if (string.IsNullOrWhiteSpace(name))
                continue;

            var value = RandomDimension(name, random);
            var binding = GetBindingKey(name);

            if (binding == "w")
                w = value;
            else if (binding == "h")
                h = value;
            else
                thamSoNhap[name] = value;
        }

        return (w, h, thamSoNhap);
    }

    private static bool HasUniqueParamBindings(NhomSanPham nhom)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var param in nhom.ThamSoCoDinhs)
        {
            var name = param.TenThamSo?.Trim();
            if (string.IsNullOrWhiteSpace(name))
                continue;

            if (!seen.Add(GetBindingKey(name)))
                return false;
        }

        return seen.Count > 0;
    }

    private static string GetBindingKey(string tenThamSo)
    {
        var normalized = tenThamSo.Trim().ToLowerInvariant();
        if (normalized is "w" or "wmax") return "w";
        if (normalized is "h" or "hmax") return "h";
        return $"thamSoNhap:{normalized}";
    }

    private static decimal RandomDimension(string paramName, Random random)
    {
        var key = paramName.Trim().ToLowerInvariant();
        return key switch
        {
            "w" or "wmax" or "w3" or "wp" or "w1" => random.Next(200, 601),
            "h" or "hmax" => random.Next(150, 501),
            "l" => random.Next(500, 3001),
            "r" => random.Next(80, 301),
            "d" => random.Next(200, 401),
            "phan_manh" => random.Next(0, 3) switch { 0 => 1, 1 => 2, _ => 4 },
            "do_lech" => random.Next(100, 401),
            "so_lo" => random.Next(1, 5),
            _ => random.Next(100, 501),
        };
    }

    private static string BuildTenSanPham(
        string tenNhom,
        decimal w,
        decimal h,
        IReadOnlyDictionary<string, decimal> thamSoNhap)
    {
        var parts = new List<string> { $"{w:0}x{h:0}" };
        if (thamSoNhap.TryGetValue("L", out var l) || thamSoNhap.TryGetValue("l", out l))
            parts.Add($"L {l:0}");
        if (thamSoNhap.TryGetValue("R", out var r) || thamSoNhap.TryGetValue("r", out r))
            parts.Add($"R {r:0}");

        return $"{tenNhom} KT {string.Join(" ", parts)} mm";
    }

    private static string PickDonViTinh(string tenNhom)
    {
        var normalized = tenNhom.ToLowerInvariant();
        if (normalized.Contains("ống") || normalized.Contains("ong"))
            return "ống";
        if (normalized.Contains("máng") || normalized.Contains("mang") || normalized.Contains("thang"))
            return "mét";
        return "cái";
    }
}
