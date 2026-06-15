using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OngGio.Application.Abstractions;
using OngGio.Application.Services;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;
using OngGio.Infrastructure.Security;
using OngGio.Infrastructure.Services;

namespace OngGio.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddMemoryCache();
        services.AddScoped<ICaptchaService, CaptchaService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IBaoGiaService, BaoGiaService>();
        services.AddScoped<DashboardService>();
        services.AddScoped<IAuthService, Services.AuthService>();
        services.AddDbContext<OngGioDbContext>(options =>
            options.UseNpgsql(connectionString));

        return services;
    }

    public static async Task SeedDataAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OngGioDbContext>();

        await db.Database.MigrateAsync();

        await SeedNhomSanPhamAsync(db);
        await SeedLoaiTonAsync(db);
        await SeedNguoiDungAsync(db);
    }

    private static async Task SeedNhomSanPhamAsync(OngGioDbContext db)
    {
        var groups = new (string TenNhom, string HinhAnh, (string Ten, decimal GiaTri)[] ThamSo)[]
        {
            ("Co 90 độ", "/images/co90.png", [
                ("R", 200), ("r", 150), ("L", 300),
                ("mi_8", 8), ("TDC", 50), ("mi_Z", 30)]),
            ("Co 45 độ", "/images/co45.png", [
                ("R", 200), ("r", 150), ("L", 250),
                ("mi_8", 8), ("TDC", 50), ("mi_Z", 30)]),
            ("Ống gió thẳng", "/images/ong-thang.png", [
                ("L", 1200), ("phan_manh", 1), ("mi_8", 8), ("TDC", 50), ("mi_Z", 30)]),
            ("Ống gió bịt 01 đầu", "/images/ong-bit-1-dau.png", [
                ("L", 1200), ("phan_manh", 1), ("mi_8", 8), ("TDC", 50), ("mi_Z", 30)]),
            ("Ống gió bịt 02 đầu", "/images/ong-bit-2-dau.png", [
                ("L", 1200), ("phan_manh", 1), ("mi_8", 8), ("TDC", 50), ("mi_Z", 30)]),
            ("Giảm (Côn thu)", "/images/giam.png", [
                ("L", 350), ("mi_8", 8), ("TDC", 50), ("mi_Z", 30)]),
            ("BZ (Ống lệch tâm)", "/images/bz.png", [
                ("L", 1000), ("DO_LECH", 300), ("mi_8", 8), ("TDC", 50), ("mi_Z", 30)]),
            ("Tê cụt", "/images/te-cut.png", [
                ("Wmax", 500), ("r", 150), ("mi_8", 8), ("TDC", 50), ("mi_Z", 30)]),
            ("Tê rẽ", "/images/te-re.png", [
                ("Wp", 250), ("r", 150), ("mi_8", 8), ("TDC", 50), ("mi_Z", 30)]),
            ("Hộp chụp miệng gió thẳng", "/images/hop-plenum.png", [
                ("L", 500), ("SO_LO", 1), ("D", 200), ("curon_L", 120),
                ("mi_8", 8), ("TDC", 50), ("mi_Z", 30)]),
            ("Chân rẽ", "/images/chan-re.png", [
                ("R", 300), ("L", 400),
                ("mi_8", 8), ("TDC", 50), ("mi_Z", 30)]),
            ("Chạc", "/images/chac.png", [
                ("Wmax", 500), ("R", 150), ("w1", 250), ("W3", 300), ("L", 1000),
                ("mi_8", 8), ("TDC", 50), ("mi_Z", 30)]),
        };

        foreach (var (tenNhom, hinhAnh, thamSo) in groups)
        {
            var nhom = await db.NhomSanPhams
                .Include(x => x.ThamSoCoDinhs)
                .FirstOrDefaultAsync(x => x.TenNhom == tenNhom || x.HinhAnhMinhHoa == hinhAnh);

            if (nhom is null)
            {
                nhom = new NhomSanPham { TenNhom = tenNhom, HinhAnhMinhHoa = hinhAnh };
                db.NhomSanPhams.Add(nhom);
                await db.SaveChangesAsync();
            }
            else
            {
                nhom.TenNhom = tenNhom;
                nhom.HinhAnhMinhHoa = hinhAnh;
            }

            foreach (var (ten, giaTri) in thamSo)
            {
                var existingParam = nhom.ThamSoCoDinhs
                    .FirstOrDefault(x => string.Equals(x.TenThamSo, ten, StringComparison.Ordinal));

                if (existingParam is null)
                {
                    nhom.ThamSoCoDinhs.Add(new ThamSoCoDinh
                    {
                        TenThamSo = ten,
                        GiaTriSo = giaTri
                    });
                }
                else
                {
                    existingParam.GiaTriSo = giaTri;
                }
            }

            await db.SaveChangesAsync();
        }
    }

    private static async Task SeedLoaiTonAsync(OngGioDbContext db)
    {
        if (await db.LoaiTons.AnyAsync())
            return;

        db.LoaiTons.AddRange(
            new LoaiTon
            {
                ThuongHieu = "Tôn Hoa Sen",
                DoDay = 0.58m,
                DonGiaM2 = 185_000m,
                GiaSanCoDinh = 150_000m,
                BangBaremJson = """[{"do_day":0.58,"ty_trong":4.5},{"do_day":0.75,"ty_trong":5.8}]"""
            },
            new LoaiTon
            {
                ThuongHieu = "Tôn Phương Nam",
                DoDay = 0.75m,
                DonGiaM2 = 210_000m,
                GiaSanCoDinh = 175_000m,
                BangBaremJson = """[{"do_day":0.75,"ty_trong":5.8},{"do_day":0.95,"ty_trong":7.3}]"""
            });

        await db.SaveChangesAsync();
    }

    private static async Task SeedNguoiDungAsync(OngGioDbContext db)
    {
        if (await db.NguoiDungs.AnyAsync())
            return;

        db.NguoiDungs.Add(new NguoiDung
        {
            TenDangNhap = "admin",
            HoTen = "Quản trị viên",
            MatKhauHash = PasswordHasher.Hash("admin123"),
            VaiTro = "ADMIN",
            DangHoatDong = true
        });
        await db.SaveChangesAsync();
    }
}
