// Đăng ký hạ tầng, DbContext, service nghiệp vụ và seed dữ liệu.
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OngGio.Application.Calculation;
using OngGio.Application.Abstractions;
using OngGio.Application.Services;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;
using OngGio.Infrastructure.Seed;
using OngGio.Infrastructure.Security;
using OngGio.Infrastructure.Services;

namespace OngGio.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddMemoryCache();
        services.AddHttpContextAccessor();
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
        await SampleBaoGiaSeeder.SeedAsync(serviceProvider);
    }

    private static async Task SeedNhomSanPhamAsync(OngGioDbContext db)
    {
        var groups = new (string TenNhom, string HinhAnh, string CongThuc, string[] ThamSoForm)[]
        {
            ("Co 90 độ", "/images/co90.png", StandardProductFormulas.Co,
                ["W", "H", "R", "r"]),
            ("Co 45 độ", "/images/co45.png", StandardProductFormulas.Co,
                ["W", "H", "R", "r"]),
            ("Ống gió thẳng", "/images/ong-thang.png", StandardProductFormulas.OngThang,
                ["W", "H", "L", "phan_manh"]),
            ("Ống gió bít 01 đầu", "/images/ong-bit-1-dau.png", StandardProductFormulas.OngBitMotDau,
                ["W", "H", "L", "phan_manh"]),
            ("Ống gió bít 02 đầu", "/images/ong-bit-2-dau.png", StandardProductFormulas.OngBitHaiDau,
                ["W", "H", "L", "phan_manh"]),
            ("Giảm (Côn thu)", "/images/giam.png", StandardProductFormulas.Giam,
                ["W", "H", "L"]),
            ("BZ (Ống lệch tâm)", "/images/bz.png", StandardProductFormulas.Bz,
                ["W", "H", "L", "DO_LECH"]),
            ("Tê cụt", "/images/te-cut.png", StandardProductFormulas.TeCut,
                ["W", "H", "r"]),
            ("Tê rẽ", "/images/te-re.png", StandardProductFormulas.TeRe,
                ["W", "H", "Wp", "L"]),
            ("Hộp chụp miệng gió thẳng", "/images/hop-plenum.png", StandardProductFormulas.HopPlenum,
                ["W", "H", "L", "SO_LO", "D"]),
            ("Chân rẽ", "/images/chan-re.png", StandardProductFormulas.ChanRe,
                ["W", "H", "L"]),
            ("Chân rẽ tròn", "/images/chan-re-tron.png", "",
                ["D", "L"]),
            ("Chạc", "/images/chac.png", StandardProductFormulas.Chac,
                ["Wmax", "R", "w1", "W3", "H", "L"]),
            ("Côn chuyển", "/images/con-chuyen.png", "",
                ["W", "H", "D", "L"]),
            ("Y ống gió", "/images/y-ong-gio.png", "",
                ["W", "H", "L"]),
            ("Van VCD", "/images/van-vcd.png", "",
                ["W", "H", "L"]),
            ("Van VCD tròn", "/images/van-vcd-tron.png", "",
                ["D", "L"]),
            ("Máng cáp có nắp", "/images/mang-cap-co-nap.png", "",
                ["W", "H", "L"]),
            ("Máng cáp không nắp", "/images/mang-cap-khong-nap.png", "",
                ["W", "H", "L"]),
            ("Thang máng cáp", "/images/thang-mang-cap.png", "",
                ["W", "H", "L"]),
        };

        foreach (var (tenNhom, hinhAnh, congThuc, thamSoForm) in groups)
        {
            var nhom = await db.NhomSanPhams
                .Include(x => x.ThamSoCoDinhs)
                .FirstOrDefaultAsync(x => x.TenNhom == tenNhom);

            if (nhom is null)
            {
                nhom = new NhomSanPham
                {
                    TenNhom = tenNhom,
                    HinhAnhMinhHoa = hinhAnh,
                    CongThucDienTich = congThuc
                };
                db.NhomSanPhams.Add(nhom);
                await db.SaveChangesAsync();
            }
            else
            {
                nhom.TenNhom = tenNhom;
                nhom.HinhAnhMinhHoa = hinhAnh;
                nhom.CongThucDienTich = congThuc;
            }

            var desiredParams = thamSoForm.ToHashSet(StringComparer.OrdinalIgnoreCase);
            foreach (var obsolete in nhom.ThamSoCoDinhs.Where(x => !desiredParams.Contains(x.TenThamSo)).ToList())
                nhom.ThamSoCoDinhs.Remove(obsolete);

            for (var i = 0; i < thamSoForm.Length; i++)
            {
                var ten = thamSoForm[i];
                var existingParam = nhom.ThamSoCoDinhs
                    .FirstOrDefault(x => string.Equals(x.TenThamSo, ten, StringComparison.OrdinalIgnoreCase));

                if (existingParam is null)
                {
                    nhom.ThamSoCoDinhs.Add(new ThamSoCoDinh
                    {
                        TenThamSo = ten,
                        GiaTriSo = 0,
                        ThuTu = i
                    });
                }
                else
                {
                    existingParam.TenThamSo = ten;
                    existingParam.GiaTriSo = 0;
                    existingParam.ThuTu = i;
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
