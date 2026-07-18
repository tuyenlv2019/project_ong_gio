using OngGio.Application.Calculation;
using OngGio.Domain.Entities;

namespace OngGio.Application.Tests;

public class PhanManhRuleTests
{
    [Theory]
    [InlineData(300, 500, 1)]
    [InlineData(300, 501, 2)]
    [InlineData(400, 400, 1)]
    public void Calculate_ApDungNguongChuVi1600Mm(decimal w, decimal h, decimal expected)
    {
        Assert.Equal(expected, PhanManhRule.Calculate(w, h));
    }

    [Fact]
    public async Task CalculationEngine_TuDongGhiDeSoManhClientGuiLen()
    {
        var engine = new CalculationEngine();
        var nhom = new NhomSanPham
        {
            Id = 1,
            TenNhom = "Ống gió thẳng",
            CongThucDienTich = StandardProductFormulas.OngThang
        };
        var loaiTon = new LoaiTon
        {
            Id = 1,
            ThuongHieu = "Test",
            DonGiaMetToi = 100_000m,
            KgMoiMetToi = 1m
        };
        var thamSoForm = new List<ThamSoCoDinh>
        {
            new() { TenThamSo = "W" },
            new() { TenThamSo = "H" },
            new() { TenThamSo = "L" },
            new() { TenThamSo = "phan_manh" }
        };
        var request = new CalculationRequest(
            1,
            1,
            300m,
            501m,
            1,
            0m,
            0m,
            new Dictionary<string, decimal>
            {
                ["L"] = 500m,
                ["phan_manh"] = 1m
            });

        var result = await engine.CalculateAsync(nhom, loaiTon, thamSoForm, request);

        Assert.Equal(1.0104m, result.DienTichSx1Cai);
    }
}
