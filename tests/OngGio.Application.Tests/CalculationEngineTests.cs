using OngGio.Application.Calculation;
using OngGio.Application.Calculation.Formulas;
using OngGio.Domain.Entities;

namespace OngGio.Application.Tests;

public class CalculationEngineTests
{
    private readonly CalculationEngine _engine = new([
        new Co90AreaFormula(),
        new OngThangAreaFormula()
    ]);

    private static NhomSanPham Co90Nhom() => new() { Id = 1, TenNhom = "Co 90 độ" };

    private static LoaiTon LoaiTonMau() => new()
    {
        Id = 1,
        ThuongHieu = "Tôn Hoa Sen",
        DoDay = 0.58m,
        DonGiaM2 = 185_000m,
        GiaSanCoDinh = 150_000m,
        BangBaremJson = """[{"do_day":0.58,"ty_trong":4.5}]"""
    };

    private static List<ThamSoCoDinh> ThamSoCo90() =>
    [
        new() { TenThamSo = "R", GiaTriSo = 200 },
        new() { TenThamSo = "r", GiaTriSo = 150 },
        new() { TenThamSo = "L", GiaTriSo = 300 },
        new() { TenThamSo = "mi_8", GiaTriSo = 8 },
        new() { TenThamSo = "TDC", GiaTriSo = 50 },
        new() { TenThamSo = "mi_Z", GiaTriSo = 30 }
    ];

    [Fact]
    public async Task ApDungGiaSan_KhiTongDienTichNhoHon1m2()
    {
        var request = new CalculationRequest(1, 1, 100, 100, 1, 50_000m, 10_000m);
        var result = await _engine.CalculateAsync(Co90Nhom(), LoaiTonMau(), ThamSoCo90(), request);

        Assert.True(result.ApDungGiaSan);
        Assert.Equal(150_000m, result.ThanhTienTon);
    }

    [Fact]
    public async Task ApDungDonGiaM2_KhiTongDienTichBang1m2()
    {
        var request = new CalculationRequest(1, 1, 1000, 1000, 50, 0m, 0m);
        var result = await _engine.CalculateAsync(Co90Nhom(), LoaiTonMau(), ThamSoCo90(), request);

        Assert.False(result.ApDungGiaSan);
        Assert.True(result.TongDienTichLo >= 1.0m);
        Assert.Equal(result.TongDienTichLo * 185_000m, result.ThanhTienTon);
    }

    [Fact]
    public async Task TinhDonGiaVaThanhTien_DungCongThuc()
    {
        var request = new CalculationRequest(1, 1, 100, 100, 2, 20_000m, 5_000m);
        var result = await _engine.CalculateAsync(Co90Nhom(), LoaiTonMau(), ThamSoCo90(), request);

        var expectedThanhTien = result.DonGiaCuoi * request.SoLuong;
        Assert.Equal(expectedThanhTien, result.ThanhTien);
        Assert.Equal(
            (result.ThanhTienTon + (request.GiaNhanCong + request.PhuKien) * request.SoLuong) / request.SoLuong,
            result.DonGiaCuoi);
    }
}
