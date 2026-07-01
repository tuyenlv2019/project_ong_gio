using ClosedXML.Excel;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Services;

namespace OngGio.Infrastructure.Tests;

public class BaoGiaExcelExporterTests
{
  private static BaoGia CreateSampleBaoGia()
  {
    return new BaoGia
    {
      MaBaoGia = "BG-TEST-001",
      TenKhachHang = "Khách test",
      TongTienTruocThue = 1_500_000m,
      ChiTietBaoGias =
      [
        new ChiTietBaoGia
        {
          Id = 1,
          TenSanPham = "Ống vuông test",
          DonViTinh = "cái",
          SoLuong = 2,
          ThueSuat = 0.08m,
          DienTichSx1Cai = 1.2m,
          TrongLuongKg = 4.5m,
          ThanhTienTon = 200_000m,
          GiaNhanCong = 20_000m,
          PhuKien = 5_000m,
          DonGiaCuoi = 250_000m,
          ThanhTien = 500_000m,
          GhiChu = "Ghi chú test",
          NhomSanPham = new NhomSanPham { TenNhom = "Ống vuông" },
          LoaiTon = new LoaiTon { ThuongHieu = "Hoa Sen", DoDay = 0.8m },
        },
      ],
    };
  }

  [Fact]
  public void Export_ReturnsNonEmptyWorkbookBytes()
  {
    var bytes = BaoGiaExcelExporter.Export(CreateSampleBaoGia());

    Assert.NotNull(bytes);
    Assert.NotEmpty(bytes);
  }

  [Fact]
  public void Export_RenamesWorksheetToBaoGia()
  {
    var bytes = BaoGiaExcelExporter.Export(CreateSampleBaoGia());

    using var stream = new MemoryStream(bytes);
    using var workbook = new XLWorkbook(stream);

    Assert.Contains(workbook.Worksheets, w => w.Name == "Báo giá");
  }

  [Fact]
  public void Export_WritesLineDataToFirstDataRow()
  {
    var bytes = BaoGiaExcelExporter.Export(CreateSampleBaoGia());

    using var stream = new MemoryStream(bytes);
    using var workbook = new XLWorkbook(stream);
    var sheet = workbook.Worksheet("Báo giá");

    Assert.Equal(1, sheet.Cell(5, 1).GetValue<int>());
    Assert.Equal("Ống vuông test", sheet.Cell(5, 2).GetString());
    Assert.Equal("Hoa Sen/ 0.8 mm", sheet.Cell(5, 3).GetString());
    Assert.Equal(2, sheet.Cell(5, 11).GetValue<int>());
    Assert.Equal(500_000m, sheet.Cell(5, 14).GetValue<decimal>());
  }

  [Fact]
  public void Export_WithNoLines_StillProducesValidWorkbook()
  {
    var baoGia = new BaoGia
    {
      MaBaoGia = "BG-EMPTY",
      TongTienTruocThue = 0m,
      ChiTietBaoGias = [],
    };

    var bytes = BaoGiaExcelExporter.Export(baoGia);

    using var stream = new MemoryStream(bytes);
    using var workbook = new XLWorkbook(stream);

    Assert.Single(workbook.Worksheets);
    Assert.Equal("Báo giá", workbook.Worksheets.Worksheet(1).Name);
  }
}
