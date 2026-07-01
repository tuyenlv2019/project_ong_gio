using OngGio.Application.Calculation;

using OngGio.Domain.Entities;



namespace OngGio.Application.Tests;



public class CalculationEngineTests

{

    private readonly CalculationEngine _engine = new();



    private static NhomSanPham Co90Nhom() => new()

    {

        Id = 1,

        TenNhom = "Co 90 độ",

        CongThucDienTich = StandardProductFormulas.Co

    };



    private static LoaiTon LoaiTonMau() => new()

    {

        Id = 1,

        ThuongHieu = "Tôn Hoa Sen",

        DoDay = 0.58m,

        DonGiaMetToi = 222_000m,

        KgMoiMetToi = 4.5m

    };



    private static List<ThamSoCoDinh> ThamSoFormCo90() =>

    [

        new() { TenThamSo = "W", GiaTriSo = 0 },

        new() { TenThamSo = "H", GiaTriSo = 0 },

        new() { TenThamSo = "R", GiaTriSo = 0 },

        new() { TenThamSo = "r", GiaTriSo = 0 }

    ];



    private static Dictionary<string, decimal> Co90Inputs() => new(StringComparer.Ordinal)

    {

        ["R"] = 200,

        ["r"] = 150

    };



    [Fact]

    public async Task TinhTheoCongThucDb_KhiCo90()

    {

        var request = new CalculationRequest(1, 1, 300, 300, 1, 50_000m, 10_000m, new Dictionary<string, decimal>(StringComparer.Ordinal)

        {

            ["r"] = 150

        });

        var result = await _engine.CalculateAsync(Co90Nhom(), LoaiTonMau(), ThamSoFormCo90(), request);



        Assert.Equal(0.927248m, result.DienTichSx1Cai, 6);

        Assert.Equal("XAC_NHAN", result.TrangThaiCongThuc);

    }



    [Fact]

    public async Task TinhTheoDonGiaMetToi_KhiTongDienTichNhoHon1m2()

    {

        var request = new CalculationRequest(1, 1, 100, 100, 1, 50_000m, 10_000m, Co90Inputs());

        var result = await _engine.CalculateAsync(Co90Nhom(), LoaiTonMau(), ThamSoFormCo90(), request);



        Assert.False(result.ApDungGiaSan);

        Assert.Equal(Math.Round(result.TongDienTichLo * 222_000m / 1.2m, 0, MidpointRounding.AwayFromZero), result.ThanhTienTon);

        Assert.Equal(result.DienTichSx1Cai / 1.2m, result.DienTichSanXuatMetToi);

        Assert.Equal(result.DienTichSanXuatMetToi * LoaiTonMau().KgMoiMetToi, result.TrongLuongKg);

    }



    [Fact]

    public async Task TinhDonGiaVaThanhTien_DungCongThuc()

    {

        var request = new CalculationRequest(1, 1, 300, 300, 2, 20_000m, 5_000m, new Dictionary<string, decimal>(StringComparer.Ordinal)

        {

            ["r"] = 150

        });

        var result = await _engine.CalculateAsync(Co90Nhom(), LoaiTonMau(), ThamSoFormCo90(), request);



        var expectedThanhTien = result.DonGiaCuoi * request.SoLuong;

        Assert.Equal(expectedThanhTien, result.ThanhTien);

    }



    [Fact]

    public async Task DonGiaCuoi_KhongPhuThuocSoLuong()

    {

        var thamSo = new Dictionary<string, decimal>(StringComparer.Ordinal) { ["r"] = 150 };

        var resultSl1 = await _engine.CalculateAsync(

            Co90Nhom(), LoaiTonMau(), ThamSoFormCo90(),

            new CalculationRequest(1, 1, 300, 300, 1, 20_000m, 5_000m, thamSo));

        var resultSl5 = await _engine.CalculateAsync(

            Co90Nhom(), LoaiTonMau(), ThamSoFormCo90(),

            new CalculationRequest(1, 1, 300, 300, 5, 20_000m, 5_000m, thamSo));



        Assert.Equal(resultSl1.DonGiaCuoi, resultSl5.DonGiaCuoi);

        Assert.Equal(

            Math.Round(222_000m * resultSl1.DienTichSanXuatMetToi + 20_000m + 5_000m, 0, MidpointRounding.AwayFromZero),

            resultSl1.DonGiaCuoi);

    }



    [Theory]

    [InlineData("CO 90 ĐỘ", nameof(StandardProductFormulas.Co))]

    [InlineData("CO 45 ĐỘ", nameof(StandardProductFormulas.Co))]

    [InlineData("GIẢM", nameof(StandardProductFormulas.Giam))]

    [InlineData("ỐNG GIÓ THẲNG", nameof(StandardProductFormulas.OngThang))]

    [InlineData("ỐNG GIÓ BỊT 01 ĐẦU", nameof(StandardProductFormulas.OngBitMotDau))]

    [InlineData("ỐNG GIÓ BỊT 02 ĐẦU", nameof(StandardProductFormulas.OngBitHaiDau))]

    [InlineData("BZ ỐNG LỆCH TÂM", nameof(StandardProductFormulas.Bz))]

    [InlineData("TÊ CỤT", nameof(StandardProductFormulas.TeCut))]

    [InlineData("TÊ RẼ", nameof(StandardProductFormulas.TeRe))]

    [InlineData("HỘP CHỤP MIỆNG GIÓ THẲNG", nameof(StandardProductFormulas.HopPlenum))]

    [InlineData("CHÂN RẼ", nameof(StandardProductFormulas.ChanRe))]

    [InlineData("CHẠC", nameof(StandardProductFormulas.Chac))]

    public async Task TinhTheoCongThucDbTheoTenNhomSanPham(string tenNhom, string formulaName)

    {

        var formula = typeof(StandardProductFormulas).GetField(formulaName)!.GetValue(null)!.ToString()!;

        var thamSoNhap = new Dictionary<string, decimal>(StringComparer.Ordinal)

        {

            ["R"] = 200,

            ["r"] = 150,

            ["L"] = 500,

            ["Wmax"] = 500,

            ["w1"] = 250,

            ["W3"] = 300,

            ["DO_LECH"] = 300,

            ["SO_LO"] = 2,

            ["D"] = 200,

            ["Wp"] = 250,

            ["phan_manh"] = 1

        };

        var request = new CalculationRequest(1, 1, 400, 300, 1, 0m, 0m, thamSoNhap);

        var thamSo = ThamSoFormCo90();



        var result = await _engine.CalculateAsync(

            new NhomSanPham { Id = 1, TenNhom = tenNhom, CongThucDienTich = formula },

            LoaiTonMau(),

            thamSo,

            request);



        Assert.True(result.DienTichSx1Cai > 0m);

        Assert.Equal("XAC_NHAN", result.TrangThaiCongThuc);

    }



    [Fact]

    public async Task BaoLoiKhiNhomSanPhamChuaCoCongThuc()

    {

        var request = new CalculationRequest(1, 1, 400, 300, 1, 0m, 0m, Co90Inputs());



        await Assert.ThrowsAsync<InvalidOperationException>(() =>

            _engine.CalculateAsync(

                new NhomSanPham { Id = 1, TenNhom = "Nhóm chưa hỗ trợ" },

                LoaiTonMau(),

                ThamSoFormCo90(),

                request));

    }

}


