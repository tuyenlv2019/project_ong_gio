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
          LoaiTon = new LoaiTon { ThuongHieu = "Hoa Sen", DoDay = 0.8m, DoMaVatLieu = "Z120" },
        },
      ],
    };
  }

  private static List<NhomSanPham> CreateSampleProducts()
  {
    return
    [
      new NhomSanPham
      {
        Id = 1,
        TenNhom = "Ống thẳng",
        CongThucDienTich = "Ssx=W*H/1000000",
        HinhAnhMinhHoa = "/images/ong-thang.png",
        ThamSoCoDinhs =
        [
          new ThamSoCoDinh { Id = 1, TenThamSo = "W", ThuTu = 0 },
          new ThamSoCoDinh { Id = 2, TenThamSo = "H", ThuTu = 1 },
        ],
      },
      new NhomSanPham
      {
        Id = 2,
        TenNhom = "Co 90°",
        CongThucDienTich = "Ssx=...",
        HinhAnhMinhHoa = null,
        ThamSoCoDinhs = [],
      },
    ];
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
  public void Export_IncludesProductCatalogSheet()
  {
    var bytes = BaoGiaExcelExporter.Export(CreateSampleBaoGia(), CreateSampleProducts());

    using var stream = new MemoryStream(bytes);
    using var workbook = new XLWorkbook(stream);

    Assert.Equal(2, workbook.Worksheets.Count);
    Assert.Contains(workbook.Worksheets, w => w.Name == "Hình ảnh sản phẩm");

    var catalog = workbook.Worksheet("Hình ảnh sản phẩm");
    Assert.Equal("STT", catalog.Cell(4, 1).GetString());
    Assert.Equal("Tên sản phẩm", catalog.Cell(4, 2).GetString());
    Assert.Equal("Hình ảnh", catalog.Cell(4, 3).GetString());
    Assert.Equal(1, catalog.Cell(5, 1).GetValue<int>());
    Assert.Equal("Co 90°", catalog.Cell(5, 2).GetString()); // sort by name
    Assert.Equal("Ống thẳng", catalog.Cell(6, 2).GetString());
    Assert.Equal("", catalog.Cell(5, 3).GetString()); // không ghi URL — chỉ nhúng ảnh
  }

  [Fact]
  public void Export_EmbedsLocalProductImageWhenWwwrootProvided()
  {
    var webRoot = Path.Combine(Path.GetTempPath(), "ong-gio-excel-test-" + Guid.NewGuid().ToString("N"));
    var imagesDir = Path.Combine(webRoot, "images");
    Directory.CreateDirectory(imagesDir);

    // PNG 1×1 hợp lệ (ClosedXML đọc lại khi mở file)
    var pngPath = Path.Combine(imagesDir, "ong-thang.png");
    File.WriteAllBytes(
      pngPath,
      Convert.FromBase64String(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="));

    try
    {
      var products = CreateSampleProducts();
      var bytes = BaoGiaExcelExporter.Export(CreateSampleBaoGia(), products, webRoot);

      using var stream = new MemoryStream(bytes);
      using var workbook = new XLWorkbook(stream);
      var catalog = workbook.Worksheet("Hình ảnh sản phẩm");

      Assert.NotEmpty(catalog.Pictures);
      // Ống thẳng là dòng 6 (sau Co 90°) — ảnh phải neo cột C (Hình ảnh), không phải A1
      var picture = Assert.Single(catalog.Pictures);
      Assert.Equal(6, picture.TopLeftCell.Address.RowNumber);
      Assert.Equal(3, picture.TopLeftCell.Address.ColumnNumber);
    }
    finally
    {
      Directory.Delete(webRoot, recursive: true);
    }
  }

  [Fact]
  public void ResolveLocalImagePath_MapsWwwrootRelativePath()
  {
    var webRoot = Path.Combine(Path.GetTempPath(), "ong-gio-excel-path-" + Guid.NewGuid().ToString("N"));
    var imagesDir = Path.Combine(webRoot, "images");
    Directory.CreateDirectory(imagesDir);
    var file = Path.Combine(imagesDir, "a.png");
    File.WriteAllText(file, "x");

    try
    {
      var resolved = BaoGiaExcelExporter.ResolveLocalImagePath("/images/a.png", webRoot);
      Assert.Equal(Path.GetFullPath(file), resolved);
      Assert.Null(BaoGiaExcelExporter.ResolveLocalImagePath("https://example.com/a.png", webRoot));
      Assert.Null(BaoGiaExcelExporter.ResolveLocalImagePath("/images/missing.png", webRoot));
    }
    finally
    {
      Directory.Delete(webRoot, recursive: true);
    }
  }

  [Fact]
  public void Export_WritesLineDataToFirstDataRow()
  {
    var bytes = BaoGiaExcelExporter.Export(CreateSampleBaoGia());

    using var stream = new MemoryStream(bytes);
    using var workbook = new XLWorkbook(stream);
    var sheet = workbook.Worksheet("Báo giá");

    Assert.Equal(1, sheet.Cell(18, 1).GetValue<int>());
    Assert.Equal("Ống vuông test", sheet.Cell(18, 2).GetString());
    Assert.Equal("Hoa Sen Z120/ 0.8 mm", sheet.Cell(18, 3).GetString());
    Assert.Equal("#,##0", sheet.Cell(18, 7).Style.NumberFormat.Format);
    Assert.Equal("#,##0", sheet.Cell(18, 8).Style.NumberFormat.Format);
    Assert.Equal("#,##0", sheet.Cell(18, 9).Style.NumberFormat.Format);
    Assert.Equal(2, sheet.Cell(18, 11).GetValue<int>());
    Assert.Equal(500_000m, sheet.Cell(18, 14).GetValue<decimal>());
  }

  [Fact]
  public void Export_WritesKinhGuiFromCustomerAndNguoiGuiFromLoginUser()
  {
    var bytes = BaoGiaExcelExporter.Export(
      CreateSampleBaoGia(),
      nguoiGuiHoTen: "Nguyễn Văn A");

    using var stream = new MemoryStream(bytes);
    using var workbook = new XLWorkbook(stream);
    var sheet = workbook.Worksheet("Báo giá");

    Assert.Equal("Kính gửi: Khách test", sheet.Cell(9, 1).GetString());
    Assert.Equal("Người gửi: Nguyễn Văn A", sheet.Cell(11, 7).GetString());
    Assert.Contains("CÔNG TY TNHH SX TM DV CƠ ĐIỆN THUẬN PHONG", sheet.Cell(2, 12).GetString());
    Assert.Equal("BÁO GIÁ", sheet.Cell(8, 1).GetString());
  }

  [Fact]
  public void Export_KeepsCompanyLogoAndDoesNotLeaveBlankStyledDataRow()
  {
    var bytes = BaoGiaExcelExporter.Export(CreateSampleBaoGia(), nguoiGuiHoTen: "Admin");

    using var stream = new MemoryStream(bytes);
    using var workbook = new XLWorkbook(stream);
    var sheet = workbook.Worksheet("Báo giá");

    Assert.NotEmpty(sheet.Pictures);
    Assert.True(sheet.Pictures.Any(p => p.TopLeftCell.Address.RowNumber < 18));

    // Dòng 18 có dữ liệu; dòng 19 là tổng — không còn thêm dòng dữ liệu trống kiểu ô vàng/xanh.
    Assert.Equal(1, sheet.Cell(18, 1).GetValue<int>());
    Assert.Equal("Tổng cộng:", sheet.Cell(19, 13).GetString());
    Assert.True(sheet.Cell(20, 1).IsEmpty());
    Assert.Equal(XLFillPatternValues.None, sheet.Cell(20, 2).Style.Fill.PatternType);
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

    Assert.Equal(2, workbook.Worksheets.Count);
    Assert.Equal("Báo giá", workbook.Worksheets.Worksheet(1).Name);
    Assert.Equal("Hình ảnh sản phẩm", workbook.Worksheets.Worksheet(2).Name);
  }
}
