using OngGio.Application.Calculation;
using OngGio.Application.Calculation.Formulas;
using OngGio.Domain.Entities;

namespace OngGio.Application.Tests;

public class CalculationEngineTests
{
    private readonly CalculationEngine _engine = new([
        new Co90AreaFormula(),
        new Co45AreaFormula(),
        new OngThangAreaFormula(),
        new OngBitMotDauAreaFormula(),
        new OngBitHaiDauAreaFormula(),
        new GiamAreaFormula(),
        new ChanReAreaFormula(),
        new BzAreaFormula(),
        new TeCutAreaFormula(),
        new TeReAreaFormula(),
        new HopPlenumAreaFormula(),
        new ChacAreaFormula()
    ]);

    private static NhomSanPham Co90Nhom() => new() { Id = 1, TenNhom = "Co 90 độ" };

    private static LoaiTon LoaiTonMau() => new()
    {
        Id = 1,
        ThuongHieu = "Tôn Hoa Sen",
        DoDay = 0.58m,
        DonGiaM2 = 185_000m,
        KgMoiMetToi = 4.5m
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
    public async Task TinhTheoDonGiaM2_KhiTongDienTichNhoHon1m2()
    {
        var request = new CalculationRequest(1, 1, 100, 100, 1, 50_000m, 10_000m);
        var result = await _engine.CalculateAsync(Co90Nhom(), LoaiTonMau(), ThamSoCo90(), request);

        Assert.False(result.ApDungGiaSan);
        Assert.Equal(result.TongDienTichLo * 185_000m, result.ThanhTienTon);
        Assert.Equal(result.DienTichSx1Cai * 1.2m, result.DienTichSanXuatMetToi);
        Assert.Equal(result.DienTichSanXuatMetToi * LoaiTonMau().KgMoiMetToi, result.TrongLuongKg);
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

    [Theory]
    [InlineData("CO 90 ĐỘ")]
    [InlineData("CO 45 ĐỘ")]
    [InlineData("GIẢM")]
    [InlineData("ỐNG GIÓ THẲNG")]
    [InlineData("ỐNG GIÓ BỊT 01 ĐẦU")]
    [InlineData("ỐNG GIÓ BỊT 02 ĐẦU")]
    [InlineData("BZ ỐNG LỆCH TÂM")]
    [InlineData("TÊ CỤT")]
    [InlineData("TÊ RẼ")]
    [InlineData("HỘP CHỤP MIỆNG GIÓ THẲNG")]
    [InlineData("CHÂN RẼ")]
    [InlineData("CHẠC")]
    public async Task ResolveDungCongThucTheoTenNhomSanPham(string tenNhom)
    {
        var request = new CalculationRequest(1, 1, 400, 300, 1, 0m, 0m);
        var thamSo = ThamSoCo90();
        thamSo.AddRange([
            new() { TenThamSo = "Wmax", GiaTriSo = 500 },
            new() { TenThamSo = "w1", GiaTriSo = 250 },
            new() { TenThamSo = "W3", GiaTriSo = 300 },
            new() { TenThamSo = "DO_LECH", GiaTriSo = 300 },
            new() { TenThamSo = "SO_LO", GiaTriSo = 2 },
            new() { TenThamSo = "D", GiaTriSo = 200 },
            new() { TenThamSo = "curon_L", GiaTriSo = 120 }
        ]);

        var result = await _engine.CalculateAsync(
            new NhomSanPham { Id = 1, TenNhom = tenNhom },
            LoaiTonMau(),
            thamSo,
            request);

        Assert.True(result.DienTichSx1Cai > 0m);
        Assert.Equal("XAC_NHAN", result.TrangThaiCongThuc);
    }

    [Fact]
    public async Task BaoLoiKhiNhomSanPhamChuaCoCongThuc()
    {
        var request = new CalculationRequest(1, 1, 400, 300, 1, 0m, 0m);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _engine.CalculateAsync(
                new NhomSanPham { Id = 1, TenNhom = "Nhóm chưa hỗ trợ" },
                LoaiTonMau(),
                ThamSoCo90(),
                request));
    }
}
