// Đăng ký hạ tầng, DbContext, service nghiệp vụ và seed dữ liệu.
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
            ("Co 90 độ", "/images/co90.png", [("R", 200), ("r", 150), ("L", 300)]),
            ("Co 45 độ", "/images/co45.png", [("R", 200), ("r", 150), ("L", 250)]),
            ("Ống gió thẳng", "/images/ong-thang.png", [("L", 1200), ("phan_manh", 1)]),
            ("Ống gió bít 01 đầu", "/images/ong-bit-1-dau.png", [("L", 1200), ("phan_manh", 1)]),
            ("Ống gió bít 02 đầu", "/images/ong-bit-2-dau.png", [("L", 1200), ("phan_manh", 1)]),
            ("Giảm (Côn thu)", "/images/giam.png", [("L", 350)]),
            ("BZ (Ống lệch tâm)", "/images/bz.png", [("L", 1000), ("DO_LECH", 300)]),
            ("Tê cụt", "/images/te-cut.png", [("Wmax", 500), ("r", 150)]),
            ("Tê rẽ", "/images/te-re.png", [("Wp", 250), ("r", 150)]),
            ("Hộp chụp miệng gió thẳng", "/images/hop-plenum.png", [("L", 500), ("SO_LO", 1), ("D", 200), ("curon_L", 120)]),
            ("Chân rẽ", "/images/chan-re.png", [("R", 300), ("L", 400)]),
            ("Chân rẽ tròn", "/images/chan-re-tron.png", [("R", 300), ("L", 400)]),
            ("Chạc", "/images/chac.png", [("Wmax", 500), ("R", 150), ("w1", 250), ("W3", 300), ("L", 1000)]),
            ("Côn chuyển", "/images/con-chuyen.png", [("L", 300)]),
            ("Y ống gió", "/images/y-ong-gio.png", [("L", 500)]),
            ("Van VCD", "/images/van-vcd.png", [("L", 200)]),
            ("Van VCD tròn", "/images/van-vcd-tron.png", [("L", 200)]),
            ("Máng cáp có nắp", "/images/mang-cap-co-nap.png", [("L", 1000)]),
            ("Máng cáp không nắp", "/images/mang-cap-khong-nap.png", [("L", 1000)]),
            ("Thang máng cáp", "/images/thang-mang-cap.png", [("L", 1000)]),
        };

        foreach (var (tenNhom, hinhAnh, thamSo) in groups)
        {
            var nhom = await db.NhomSanPhams
                .Include(x => x.ThamSoCoDinhs)
                .FirstOrDefaultAsync(x => x.TenNhom == tenNhom);

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

        await SyncNhomSanPhamImagePathsAsync(db);
    }

    private static async Task SyncNhomSanPhamImagePathsAsync(OngGioDbContext db)
    {
        var nhomList = await db.NhomSanPhams.ToListAsync();
        var changed = false;

        foreach (var nhom in nhomList)
        {
            var imagePath = ResolveNhomImagePath(nhom.TenNhom);
            if (imagePath is null || nhom.HinhAnhMinhHoa == imagePath)
                continue;

            nhom.HinhAnhMinhHoa = imagePath;
            changed = true;
        }

        if (changed)
            await db.SaveChangesAsync();
    }

    private static string? ResolveNhomImagePath(string tenNhom)
    {
        var normalized = NormalizeNhomKey(tenNhom);

        if (normalized.Contains("CO 90") || normalized.Contains("CO90"))
            return "/images/co90.png";
        if (normalized.Contains("CO 45") || normalized.Contains("CO45"))
            return "/images/co45.png";
        if (normalized.Contains("BIT 02") || normalized.Contains("BIT 2") || normalized.Contains("BIT HAI") || normalized.Contains("BIT 2 DAU"))
            return "/images/ong-bit-2-dau.png";
        if (normalized.Contains("BIT 01") || normalized.Contains("BIT 1") || normalized.Contains("BIT MOT") || normalized.Contains("BIT 1 DAU"))
            return "/images/ong-bit-1-dau.png";
        if (normalized.Contains("VAN VCD") && (normalized.Contains("TRON") || normalized.Contains("KT D")))
            return "/images/van-vcd-tron.png";
        if (normalized.Contains("VAN VCD"))
            return "/images/van-vcd.png";
        if (normalized.Contains("THANG MANG CAP"))
            return "/images/thang-mang-cap.png";
        if (normalized.Contains("MANG CAP") && normalized.Contains("CO NAP"))
            return "/images/mang-cap-co-nap.png";
        if (normalized.Contains("MANG CAP") && normalized.Contains("KHONG NAP"))
            return "/images/mang-cap-khong-nap.png";
        if (normalized.Contains("MANG CAP"))
            return "/images/mang-cap-co-nap.png";
        if (normalized.Contains("Y ONG") || normalized.StartsWith("Y "))
            return "/images/y-ong-gio.png";
        if (normalized.Contains("CON CHUYEN"))
            return "/images/con-chuyen.png";
        if (normalized.Contains("TE CUT") || normalized.Contains("TE CUCT"))
            return "/images/te-cut.png";
        if (normalized.Contains("TE RE") || (normalized.Contains("TE") && normalized.Contains("ONG GIO")))
            return "/images/te-re.png";
        if (normalized.Contains("CHAN RE") && normalized.Contains("TRON"))
            return "/images/chan-re-tron.png";
        if (normalized.Contains("CHAN RE"))
            return "/images/chan-re.png";
        if (normalized.Contains("CHAC"))
            return "/images/chac.png";
        if (normalized.Contains("HOP") || normalized.Contains("PLENUM") || normalized.Contains("ZIGZAC"))
            return "/images/hop-plenum.png";
        if (normalized.Contains("GIAM") || normalized.Contains("CON THU"))
            return "/images/giam.png";
        if (normalized.Contains("BZ") || normalized.Contains("LECH TAM") || normalized.Contains("CO NGONG"))
            return "/images/bz.png";
        if (normalized.Contains("ONG THANG") || normalized.Contains("ONG GIO THANG") || normalized.Contains("ONG GIO KT"))
            return "/images/ong-thang.png";

        return null;
    }

    private static string NormalizeNhomKey(string value)
    {
        var decomposed = value.Normalize(System.Text.NormalizationForm.FormD);
        var builder = new System.Text.StringBuilder(decomposed.Length);

        foreach (var c in decomposed)
        {
            var category = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (category != System.Globalization.UnicodeCategory.NonSpacingMark)
                builder.Append(c is 'd' or 'D' or 'đ' or 'Đ' ? 'D' : char.ToUpperInvariant(c));
        }

        return builder.ToString().Normalize(System.Text.NormalizationForm.FormC);
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
                KgMoiMetToi = 4.5m
            },
            new LoaiTon
            {
                ThuongHieu = "Tôn Phương Nam",
                DoDay = 0.75m,
                DonGiaM2 = 210_000m,
                KgMoiMetToi = 5.8m
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
