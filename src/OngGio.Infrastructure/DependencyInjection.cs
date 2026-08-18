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
        services.AddScoped<CloudinaryImageService>();
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
        await EnsureExtraLoaiTonTestDataAsync(db);
        await SyncDoMaVatLieuAsync(db);
        await SeedNguoiDungAsync(db);
        await SampleBaoGiaSeeder.SeedAsync(serviceProvider);

        var cloudinaryImageService = scope.ServiceProvider.GetRequiredService<CloudinaryImageService>();
        await cloudinaryImageService.MigrateNhomSanPhamImagesAsync();
    }

    private static async Task SeedNhomSanPhamAsync(OngGioDbContext db)
    {
        // MauTen theo convention thương mại (VD: L1120, R150, D300 — không khoảng sau chữ cái).
        // FormerNames: đổi tên nhóm cũ → tên mới mà không tạo bản ghi trùng.
        var groups = new (
            string TenNhom,
            string HinhAnh,
            string CongThuc,
            string MauTen,
            string[] ThamSoForm,
            string[] FormerNames)[]
        {
            ("Co 90 độ", "/images/co90.png", StandardProductFormulas.Co,
                "Co 90 độ KT {W}x{H} R{R} mm",
                ["W", "H", "R", "r"], []),
            ("Co 45 độ", "/images/co45.png", StandardProductFormulas.Co,
                "Co 45 độ KT {W}x{H} R{R} mm",
                ["W", "H", "R", "r"], []),
            ("Ống gió thẳng", "/images/ong-thang.png", StandardProductFormulas.OngThang,
                "Ống gió KT {W}x{H} L{L} mm",
                ["W", "H", "L", "phan_manh"], []),
            ("Ống gió bít 01 đầu", "/images/ong-bit-1-dau.png", StandardProductFormulas.OngBitMotDau,
                "Ống gió KT {W}x{H} L{L} mm, bịt 1 đầu",
                ["W", "H", "L", "phan_manh"], []),
            ("Ống gió bít 02 đầu", "/images/ong-bit-2-dau.png", StandardProductFormulas.OngBitHaiDau,
                "Ống gió KT {W}x{H} L{L} mm, bịt 2 đầu",
                ["W", "H", "L", "phan_manh"], []),
            ("Côn giảm", "/images/giam.png", StandardProductFormulas.Giam,
                "Côn giảm KT {W}x{H} L{L} mm",
                ["W", "H", "L"], ["Giảm (Côn thu)", "Giảm"]),
            ("BZ (Ống lệch tâm)", "/images/bz.png", StandardProductFormulas.Bz,
                "Ống gió KT {W}x{H} L{L} mm lệch tâm {DO_LECH} mm",
                ["W", "H", "L", "DO_LECH"], []),
            ("Tê cụt", "/images/te-cut.png", StandardProductFormulas.TeCut,
                "Tê cụt KT {W}x{H} R{r} mm",
                ["W", "H", "r"], []),
            ("Tê ống gió", "/images/te-re.png", StandardProductFormulas.TeRe,
                "Tê ống gió KT {W}x{H} Wp{Wp} L{L} mm",
                ["W", "H", "Wp", "L"], ["Tê rẽ"]),
            ("Hộp gió", "/images/hop-plenum.png", StandardProductFormulas.HopPlenum,
                "Hộp gió KT {W}x{H} L{L} mm",
                ["W", "H", "L", "SO_LO", "D"], ["Hộp chụp miệng gió thẳng"]),
            ("Chân rẽ vuông", "/images/chan-re.png", StandardProductFormulas.ChanRe,
                "Chân rẽ vuông KT {W}x{H} L{L} mm",
                ["W", "H", "L"], ["Chân rẽ"]),
            ("Chân rẽ tròn", "/images/chan-re-tron.png", "",
                "Chân rẽ tròn KT D{D} L{L} mm",
                ["D", "L"], []),
            ("Chạc", "/images/chac.png", StandardProductFormulas.Chac,
                "Chạc KT {Wmax}x{H} R{R} W3{W3} L{L} mm",
                ["Wmax", "R", "W3", "H", "L"], []),
            ("Côn chuyển", "/images/con-chuyen.png", "",
                "Côn chuyển KT {W}x{H} - D{D} L{L} mm",
                ["W", "H", "D", "L"], []),
            ("Y ống gió", "/images/y-ong-gio.png", "",
                "Y ống gió KT {W}x{H} L{L} mm",
                ["W", "H", "L"], []),
            ("Van VCD", "/images/van-vcd.png", "",
                "Van VCD KT {W}x{H} L{L} mm",
                ["W", "H", "L"], []),
            ("Van VCD tròn", "/images/van-vcd-tron.png", "",
                "Van VCD KT D{D} L{L} mm",
                ["D", "L"], []),
            ("Máng cáp có nắp", "/images/mang-cap-co-nap.png", "",
                "Máng cáp có nắp KT {W}x{H} L{L} mm",
                ["W", "H", "L"], []),
            ("Máng cáp không nắp", "/images/mang-cap-khong-nap.png", "",
                "Máng cáp không nắp KT {W}x{H} L{L} mm",
                ["W", "H", "L"], []),
            ("Thang máng cáp không nắp", "/images/thang-mang-cap.png", StandardProductFormulas.OngThang,
                "Thang máng cáp không nắp KT {W}x{H} L{L} mm",
                ["W", "H", "L", "phan_manh"], ["Thang máng cáp"]),
        };

        foreach (var (tenNhom, hinhAnh, congThuc, mauTen, thamSoForm, formerNames) in groups)
        {
            var lookupNames = new[] { tenNhom }.Concat(formerNames).ToArray();
            var nhom = await db.NhomSanPhams
                .Include(x => x.ThamSoCoDinhs)
                .FirstOrDefaultAsync(x => lookupNames.Contains(x.TenNhom));

            if (nhom is null)
            {
                nhom = new NhomSanPham
                {
                    TenNhom = tenNhom,
                    HinhAnhMinhHoa = hinhAnh,
                    CongThucDienTich = congThuc,
                    MauTenSanPham = mauTen
                };
                db.NhomSanPhams.Add(nhom);
                await db.SaveChangesAsync();
            }
            else
            {
                nhom.TenNhom = tenNhom;
                nhom.HinhAnhMinhHoa = hinhAnh;
                nhom.MauTenSanPham = mauTen;
                if (string.IsNullOrWhiteSpace(nhom.CongThucDienTich))
                    nhom.CongThucDienTich = congThuc;
            }

            // Đổi tên / thêm tham số trước, rồi mới xóa tham số thừa (tránh mất DO_LECH→N…).
            for (var i = 0; i < thamSoForm.Length; i++)
            {
                var ten = thamSoForm[i];
                var existingParam = nhom.ThamSoCoDinhs
                    .FirstOrDefault(x => string.Equals(x.TenThamSo, ten, StringComparison.OrdinalIgnoreCase));

                if (existingParam is null)
                    existingParam = ResolveLegacyThamSo(nhom.ThamSoCoDinhs, ten);

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

            var desiredParams = thamSoForm.ToHashSet(StringComparer.OrdinalIgnoreCase);
            foreach (var obsolete in nhom.ThamSoCoDinhs.Where(x => !desiredParams.Contains(x.TenThamSo)).ToList())
                nhom.ThamSoCoDinhs.Remove(obsolete);

            await db.SaveChangesAsync();
        }

        await SyncNhomSanPhamImagePathsAsync(db);
    }

    /// <summary>Map tên tham số đã đổi tạm thời về tên gốc khi sync seed.</summary>
    private static ThamSoCoDinh? ResolveLegacyThamSo(ICollection<ThamSoCoDinh> existing, string desiredName)
    {
        return desiredName.ToUpperInvariant() switch
        {
            "DO_LECH" => existing.FirstOrDefault(x =>
                string.Equals(x.TenThamSo, "N", StringComparison.OrdinalIgnoreCase)
                || string.Equals(x.TenThamSo, "DO_LECH", StringComparison.OrdinalIgnoreCase)),
            "WP" => existing.FirstOrDefault(x =>
                string.Equals(x.TenThamSo, "W2", StringComparison.OrdinalIgnoreCase)
                || string.Equals(x.TenThamSo, "Wp", StringComparison.OrdinalIgnoreCase)),
            "WMAX" => existing.FirstOrDefault(x =>
                string.Equals(x.TenThamSo, "W", StringComparison.OrdinalIgnoreCase)
                || string.Equals(x.TenThamSo, "Wmax", StringComparison.OrdinalIgnoreCase)),
            _ => null
        };
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
        if (normalized.Contains("CON GIAM") || normalized.Contains("GIAM") || normalized.Contains("CON THU"))
            return "/images/giam.png";
        if (normalized.Contains("BZ") || normalized.Contains("LECH TAM") || normalized.Contains("CO NGONG"))
            return "/images/bz.png";
        if (normalized.Contains("ONG THANG") || normalized.Contains("ONG GIO THANG"))
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

        db.LoaiTons.AddRange(CreateDefaultLoaiTons());
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Dữ liệu test loại tôn kèm độ mạ vật liệu (chỉ dùng khi bảng trống).
    /// </summary>
    private static LoaiTon[] CreateDefaultLoaiTons() =>
    [
        new LoaiTon
        {
            ThuongHieu = "Tôn Hoa Sen",
            DoDay = 0.58m,
            DoMaVatLieu = "Z120",
            DonGiaMetToi = 222_000m,
            KgMoiMetToi = 4.5m
        },
        new LoaiTon
        {
            ThuongHieu = "Tôn Phương Nam",
            DoDay = 0.75m,
            DoMaVatLieu = "Z275",
            DonGiaMetToi = 252_000m,
            KgMoiMetToi = 5.8m
        },
        new LoaiTon
        {
            ThuongHieu = "Tôn Hoa Sen",
            DoDay = 0.45m,
            DoMaVatLieu = "Z100",
            DonGiaMetToi = 198_000m,
            KgMoiMetToi = 3.6m
        },
        new LoaiTon
        {
            ThuongHieu = "Tôn Nam Kim",
            DoDay = 0.50m,
            DoMaVatLieu = "Z140",
            DonGiaMetToi = 210_000m,
            KgMoiMetToi = 4.0m
        },
        new LoaiTon
        {
            ThuongHieu = "Tôn Đông Á",
            DoDay = 0.80m,
            DoMaVatLieu = "Z200",
            DonGiaMetToi = 268_000m,
            KgMoiMetToi = 6.2m
        },
    ];

    /// <summary>
    /// Bổ sung thêm loại tôn test (có độ mạ) nếu chưa có cặp thương hiệu + độ dày tương ứng.
    /// </summary>
    private static async Task EnsureExtraLoaiTonTestDataAsync(OngGioDbContext db)
    {
        var extras = new[]
        {
            new LoaiTon
            {
                ThuongHieu = "Tôn Hoa Sen",
                DoDay = 0.45m,
                DoMaVatLieu = "Z100",
                DonGiaMetToi = 198_000m,
                KgMoiMetToi = 3.6m
            },
            new LoaiTon
            {
                ThuongHieu = "Tôn Nam Kim",
                DoDay = 0.50m,
                DoMaVatLieu = "Z140",
                DonGiaMetToi = 210_000m,
                KgMoiMetToi = 4.0m
            },
            new LoaiTon
            {
                ThuongHieu = "Tôn Đông Á",
                DoDay = 0.80m,
                DoMaVatLieu = "Z200",
                DonGiaMetToi = 268_000m,
                KgMoiMetToi = 6.2m
            },
        };

        var existing = await db.LoaiTons
            .Select(x => new { x.ThuongHieu, x.DoDay })
            .ToListAsync();

        var toAdd = extras
            .Where(e => !existing.Any(x =>
                string.Equals(x.ThuongHieu, e.ThuongHieu, StringComparison.OrdinalIgnoreCase)
                && x.DoDay == e.DoDay))
            .ToList();

        if (toAdd.Count == 0)
            return;

        db.LoaiTons.AddRange(toAdd);
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Điền Độ mạ vật liệu cho các loại tôn cũ còn trống (sau khi thêm cột).
    /// </summary>
    private static async Task SyncDoMaVatLieuAsync(OngGioDbContext db)
    {
        var missing = await db.LoaiTons
            .Where(x => string.IsNullOrWhiteSpace(x.DoMaVatLieu))
            .OrderBy(x => x.Id)
            .ToListAsync();

        if (missing.Count == 0)
            return;

        foreach (var item in missing)
            item.DoMaVatLieu = ResolveTestDoMaVatLieu(item);

        await db.SaveChangesAsync();
    }

    private static string ResolveTestDoMaVatLieu(LoaiTon item)
    {
        var brand = item.ThuongHieu ?? string.Empty;
        if (brand.Contains("Hoa Sen", StringComparison.OrdinalIgnoreCase))
            return item.DoDay <= 0.5m ? "Z100" : "Z120";
        if (brand.Contains("Phương Nam", StringComparison.OrdinalIgnoreCase)
            || brand.Contains("Phuong Nam", StringComparison.OrdinalIgnoreCase))
            return "Z275";
        if (brand.Contains("Nam Kim", StringComparison.OrdinalIgnoreCase))
            return "Z140";
        if (brand.Contains("Đông Á", StringComparison.OrdinalIgnoreCase)
            || brand.Contains("Dong A", StringComparison.OrdinalIgnoreCase))
            return "Z200";

        if (item.DoDay <= 0.45m) return "Z100";
        if (item.DoDay <= 0.58m) return "Z120";
        if (item.DoDay <= 0.70m) return "Z180";
        return "Z275";
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
