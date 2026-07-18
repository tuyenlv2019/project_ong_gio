using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using OngGio.Application.Abstractions;
using OngGio.Application.Calculation;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;
using OngGio.Infrastructure.Security;

namespace OngGio.Api.Tests;

/// <summary>
/// Host API cho integration test: InMemory DB + captcha luôn hợp lệ.
/// </summary>
public class OngGioWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "OngGioApiTests_" + Guid.NewGuid().ToString("N");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll(typeof(DbContextOptions<OngGioDbContext>));
            services.RemoveAll(typeof(OngGioDbContext));

            services.AddDbContext<OngGioDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));

            services.RemoveAll(typeof(ICaptchaService));
            services.AddScoped<ICaptchaService, AlwaysValidCaptchaService>();
        });
    }

    public async Task SeedAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OngGioDbContext>();
        await db.Database.EnsureCreatedAsync();

        if (!await db.NguoiDungs.AnyAsync())
        {
            db.NguoiDungs.Add(new NguoiDung
            {
                TenDangNhap = "admin",
                HoTen = "Quản trị viên",
                MatKhauHash = PasswordHasher.Hash("admin123"),
                VaiTro = "ADMIN",
                DangHoatDong = true
            });
        }

        if (!await db.NhomSanPhams.AnyAsync())
        {
            db.NhomSanPhams.Add(new NhomSanPham
            {
                TenNhom = "Ống gió thẳng",
                CongThucDienTich = StandardProductFormulas.OngThang,
                HinhAnhMinhHoa = "/images/ong-thang.png",
                ThamSoCoDinhs =
                [
                    new ThamSoCoDinh { TenThamSo = "W", GiaTriSo = 0, ThuTu = 0 },
                    new ThamSoCoDinh { TenThamSo = "H", GiaTriSo = 0, ThuTu = 1 },
                    new ThamSoCoDinh { TenThamSo = "L", GiaTriSo = 0, ThuTu = 2 },
                    new ThamSoCoDinh { TenThamSo = "phan_manh", GiaTriSo = 0, ThuTu = 3 },
                ]
            });
        }

        if (!await db.LoaiTons.AnyAsync())
        {
            db.LoaiTons.Add(new LoaiTon
            {
                ThuongHieu = "Hoa Sen",
                DoDay = 0.75m,
                DoMaVatLieu = "Z120",
                DonGiaMetToi = 100_000m,
                KgMoiMetToi = 7.5m
            });
        }

        await db.SaveChangesAsync();
    }

    private sealed class AlwaysValidCaptchaService : ICaptchaService
    {
        public Task<CaptchaChallenge> CreateCaptchaAsync(CancellationToken ct = default) =>
            Task.FromResult(new CaptchaChallenge("test-token", "dGVzdA=="));

        public Task<bool> ValidateCaptchaAsync(string token, string answer, CancellationToken ct = default) =>
            Task.FromResult(true);
    }
}
