using ClosedXML.Excel;
using OngGio.Domain.Entities;

namespace OngGio.Infrastructure.Services;

/// <summary>
/// Xuất báo giá ra Excel theo mẫu (letterhead + bảng tính),
/// kèm sheet danh mục toàn bộ sản phẩm và hình ảnh minh họa trong hệ thống.
/// </summary>
internal static class BaoGiaExcelExporter
{
    private const string TemplateFileName = "BaoGiaExportTemplate.xlsx";
    private const string OutputWorksheetName = "Báo giá";
    private const string ProductCatalogWorksheetName = "Hình ảnh sản phẩm";
    private static readonly string[] TemplateWorksheetNames = ["Báo giá", "Sheet 2"];

    // Letterhead: dòng 1–13; tiêu đề bảng: 14; header cột: 16–17; dữ liệu/footer từ 18.
    private const int KinhGuiRow = 9;
    private const int NguoiGuiRow = 11;
    private const int DataStartRow = 18;
    private const int StyleSourceRow = 18;
    private const int FooterStartRow = 19;
    private const int FooterEndRow = 24;
    private const string MoneyNumberFormat = "#,##0";

    // Cột nhập liệu (màu vàng nhạt) vs cột tính theo công thức (màu xanh nhạt) theo mẫu Sheet 2.
    private static readonly int[] InputColumns = { 2, 3, 7, 8, 9, 10, 11, 12, 15 };
    private static readonly int[] FormulaColumns = { 4, 5, 6, 13, 14 };
    private const int InputStyleColumn = 11;   // K
    private const int FormulaStyleColumn = 4; // D

    private const int CatalogImageColumn = 3;
    private const int CatalogImageWidthPx = 120;
    private const int CatalogImageHeightPx = 90;
    private const double CatalogRowHeight = 72;

    internal static byte[] Export(
        BaoGia baoGia,
        IReadOnlyList<NhomSanPham>? products = null,
        string? webRootPath = null,
        string? nguoiGuiHoTen = null)
    {
        var templatePath = ResolveTemplatePath();

        using var templateWorkbook = new XLWorkbook(templatePath);
        var templateSheet = GetExportWorksheet(templateWorkbook);

        using var workbook = new XLWorkbook(templatePath);
        var sheet = GetExportWorksheet(workbook);
        foreach (var extraSheet in workbook.Worksheets.Where(w => w != sheet).ToList())
            extraSheet.Delete();

        if (!string.Equals(sheet.Name, OutputWorksheetName, StringComparison.Ordinal))
            sheet.Name = OutputWorksheetName;

        // Giữ logo letterhead; chỉ xóa ảnh nằm trong vùng dữ liệu/footer cũ.
        RemovePicturesFromRow(sheet, DataStartRow);
        EnsureCompanyLogo(sheet);

        WriteLetterheadFields(sheet, baoGia.TenKhachHang, nguoiGuiHoTen);

        var lastRow = Math.Max(
            sheet.LastRowUsed()?.RowNumber() ?? FooterEndRow,
            FooterEndRow);
        if (lastRow >= DataStartRow)
            sheet.Rows(DataStartRow, lastRow).Delete();

        var row = DataStartRow;
        var stt = 1;
        var lines = baoGia.ChiTietBaoGias.OrderBy(x => x.Id).ToList();
        foreach (var line in lines)
        {
            if (row > DataStartRow)
                sheet.Row(row - 1).InsertRowsBelow(1);

            templateSheet.Row(StyleSourceRow).CopyTo(sheet.Row(row));
            WriteLineRow(sheet, row, stt++, line);
            ApplyRowCellColors(sheet, templateSheet, row);
            row++;
        }

        if (lines.Count > 0)
        {
            // Xóa fill kiểu dòng dữ liệu trên hàng tổng (tránh nhìn như dòng trắng trong bảng).
            ClearRowFill(sheet, row);
            sheet.Cell(row, 13).Value = "Tổng cộng:";
            sheet.Cell(row, 13).Style.Font.Bold = true;
            sheet.Cell(row, 14).Value = baoGia.TongTienTruocThue;
            sheet.Cell(row, 14).Style.Font.Bold = true;
            row++;
        }

        // Một dòng trống ngăn cách bảng và ghi chú (không copy style ô nhập liệu).
        ClearRowFill(sheet, row);
        row++;

        var footerTargetRow = row;
        for (var footerRow = FooterStartRow; footerRow <= FooterEndRow; footerRow++)
        {
            templateSheet.Row(footerRow).CopyTo(sheet.Row(footerTargetRow + (footerRow - FooterStartRow)));
        }

        AddProductCatalogSheet(workbook, products ?? [], webRootPath);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void WriteLetterheadFields(IXLWorksheet sheet, string? tenKhachHang, string? nguoiGuiHoTen)
    {
        var khach = (tenKhachHang ?? string.Empty).Trim();
        var nguoiGui = (nguoiGuiHoTen ?? string.Empty).Trim();

        sheet.Cell(KinhGuiRow, 1).Value = string.IsNullOrEmpty(khach)
            ? "Kính gửi: "
            : $"Kính gửi: {khach}";

        sheet.Cell(NguoiGuiRow, 7).Value = string.IsNullOrEmpty(nguoiGui)
            ? "Người gửi: "
            : $"Người gửi: {nguoiGui}";
    }

    private static void AddProductCatalogSheet(
        XLWorkbook workbook,
        IReadOnlyList<NhomSanPham> products,
        string? webRootPath)
    {
        var existing = workbook.Worksheets.FirstOrDefault(w => w.Name == ProductCatalogWorksheetName);
        existing?.Delete();

        var sheet = workbook.Worksheets.Add(ProductCatalogWorksheetName);

        sheet.Cell(1, 1).Value = "DANH MỤC SẢN PHẨM TRONG HỆ THỐNG";
        sheet.Cell(1, 1).Style.Font.Bold = true;
        sheet.Cell(1, 1).Style.Font.FontSize = 14;
        sheet.Range(1, 1, 1, CatalogImageColumn).Merge();

        sheet.Cell(2, 1).Value = $"Tổng số: {products.Count} sản phẩm";
        sheet.Cell(2, 1).Style.Font.Italic = true;
        sheet.Range(2, 1, 2, CatalogImageColumn).Merge();

        var headers = new[] { "STT", "Tên sản phẩm", "Hình ảnh" };
        for (var col = 1; col <= headers.Length; col++)
        {
            var cell = sheet.Cell(4, col);
            cell.Value = headers[col - 1];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#003D82");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        sheet.Column(1).Width = 6;
        sheet.Column(2).Width = 36;
        sheet.Column(CatalogImageColumn).Width = 18;

        var ordered = products
            .OrderBy(p => p.TenNhom, StringComparer.OrdinalIgnoreCase)
            .ThenBy(p => p.Id)
            .ToList();

        var dataRow = 5;
        for (var i = 0; i < ordered.Count; i++)
        {
            var product = ordered[i];

            sheet.Cell(dataRow, 1).Value = i + 1;
            sheet.Cell(dataRow, 2).Value = product.TenNhom ?? "";

            sheet.Row(dataRow).Height = CatalogRowHeight;
            sheet.Cell(dataRow, 1).Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            sheet.Cell(dataRow, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            sheet.Cell(dataRow, 2).Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            sheet.Cell(dataRow, 2).Style.Alignment.WrapText = true;

            TryAddProductPicture(sheet, dataRow, product, webRootPath);
            dataRow++;
        }

        if (ordered.Count == 0)
        {
            sheet.Cell(5, 1).Value = "Chưa có sản phẩm trong hệ thống.";
            sheet.Range(5, 1, 5, CatalogImageColumn).Merge();
        }

        sheet.SheetView.FreezeRows(4);
    }

    private static void TryAddProductPicture(
        IXLWorksheet sheet,
        int row,
        NhomSanPham product,
        string? webRootPath)
    {
        var imagePath = ResolveLocalImagePath(product.HinhAnhMinhHoa, webRootPath);
        if (imagePath is null)
            return;

        try
        {
            // ClosedXML: phải MoveTo vào ô trước, rồi mới Scale.
            // Chain WithSize → MoveTo(offset) / gán Name dễ làm mất anchor → ảnh xếp đè A1.
            using var stream = new FileStream(imagePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            var picture = sheet.AddPicture(stream);
            var target = sheet.Cell(row, CatalogImageColumn);
            picture.MoveTo(target);

            var originalW = picture.OriginalWidth > 0 ? picture.OriginalWidth : picture.Width;
            var originalH = picture.OriginalHeight > 0 ? picture.OriginalHeight : picture.Height;
            if (originalW > 0 && originalH > 0)
            {
                var scale = Math.Min(
                    (double)CatalogImageWidthPx / originalW,
                    (double)CatalogImageHeightPx / originalH);
                if (scale > 0 && Math.Abs(scale - 1d) > 0.001)
                    picture.Scale(scale);
            }
            else
            {
                picture.Width = CatalogImageWidthPx;
                picture.Height = CatalogImageHeightPx;
            }
        }
        catch
        {
            // Bỏ qua ảnh lỗi / định dạng không hỗ trợ — vẫn giữ dòng dữ liệu.
        }
    }

    /// <summary>
    /// Map đường dẫn DB (/images/...) sang file trong wwwroot. Bỏ qua URL http(s).
    /// </summary>
    internal static string? ResolveLocalImagePath(string? hinhAnhMinhHoa, string? webRootPath)
    {
        if (string.IsNullOrWhiteSpace(hinhAnhMinhHoa) || string.IsNullOrWhiteSpace(webRootPath))
            return null;

        var value = hinhAnhMinhHoa.Trim();
        if (value.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var relative = value.Replace('\\', '/').TrimStart('/');
        if (relative.Length == 0 || relative.Contains("..", StringComparison.Ordinal))
            return null;

        var fullPath = Path.GetFullPath(Path.Combine(webRootPath, relative.Replace('/', Path.DirectorySeparatorChar)));
        var rootFull = Path.GetFullPath(webRootPath);
        if (!fullPath.StartsWith(rootFull, StringComparison.OrdinalIgnoreCase))
            return null;

        return File.Exists(fullPath) ? fullPath : null;
    }

    private static void RemovePicturesFromRow(IXLWorksheet sheet, int fromRowInclusive)
    {
        foreach (var picture in sheet.Pictures
                     .Where(p => p.TopLeftCell.Address.RowNumber >= fromRowInclusive)
                     .ToList())
        {
            picture.Delete();
        }
    }

    private static void EnsureCompanyLogo(IXLWorksheet sheet)
    {
        if (sheet.Pictures.Any(p =>
                string.Equals(p.Name, "company-logo", StringComparison.OrdinalIgnoreCase)
                || p.TopLeftCell.Address.RowNumber < DataStartRow))
        {
            return;
        }

        var logoPath = Path.Combine(AppContext.BaseDirectory, "Templates", "company-logo.jpeg");
        if (!File.Exists(logoPath))
            return;

        try
        {
            using var stream = new FileStream(logoPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            var picture = sheet.AddPicture(stream);
            picture.Name = "company-logo";
            picture.MoveTo(sheet.Cell(2, 1));
            picture.Width = 160;
            picture.Height = 90;
        }
        catch
        {
            // Bỏ qua nếu không nhúng được logo — vẫn xuất được nội dung.
        }
    }

    private static void ClearRowFill(IXLWorksheet sheet, int row)
    {
        for (var col = 1; col <= 15; col++)
            sheet.Cell(row, col).Style.Fill.PatternType = XLFillPatternValues.None;
    }

    private static void WriteLineRow(IXLWorksheet sheet, int row, int stt, ChiTietBaoGia line)
    {
        var loaiTon = line.LoaiTon;
        var nhom = line.NhomSanPham;
        var dienTichMetToi = line.DienTichSx1Cai / 1.2m;

        sheet.Cell(row, 1).Value = stt;
        sheet.Cell(row, 2).Value = line.TenSanPham ?? nhom?.TenNhom ?? "";
        // Cột Xuất xứ/Độ dày tôn: thương hiệu + độ mạ / độ dày
        sheet.Cell(row, 3).Value = loaiTon is null
            ? ""
            : string.IsNullOrWhiteSpace(loaiTon.DoMaVatLieu)
                ? $"{loaiTon.ThuongHieu}/ {loaiTon.DoDay} mm"
                : $"{loaiTon.ThuongHieu} {loaiTon.DoMaVatLieu}/ {loaiTon.DoDay} mm";
        sheet.Cell(row, 4).Value = line.DienTichSx1Cai;
        sheet.Cell(row, 5).Value = dienTichMetToi;
        sheet.Cell(row, 6).Value = line.TrongLuongKg;
        sheet.Cell(row, 7).Value = line.ThanhTienTon;
        sheet.Cell(row, 8).Value = line.GiaNhanCong;
        sheet.Cell(row, 9).Value = line.PhuKien;
        sheet.Range(row, 7, row, 9).Style.NumberFormat.Format = MoneyNumberFormat;
        sheet.Cell(row, 10).Value = line.DonViTinh;
        sheet.Cell(row, 11).Value = line.SoLuong;
        sheet.Cell(row, 12).Value = line.ThueSuat;
        sheet.Cell(row, 13).Value = line.DonGiaCuoi;
        sheet.Cell(row, 14).Value = line.ThanhTien;
        sheet.Cell(row, 15).Value = line.GhiChu ?? "";
    }

    private static void ApplyRowCellColors(IXLWorksheet sheet, IXLWorksheet templateSheet, int row)
    {
        var inputFill = templateSheet.Cell(StyleSourceRow, InputStyleColumn).Style.Fill;
        var formulaFill = templateSheet.Cell(StyleSourceRow, FormulaStyleColumn).Style.Fill;

        foreach (var col in InputColumns)
            sheet.Cell(row, col).Style.Fill = inputFill;

        foreach (var col in FormulaColumns)
            sheet.Cell(row, col).Style.Fill = formulaFill;
    }

    private static IXLWorksheet GetExportWorksheet(XLWorkbook workbook)
    {
        foreach (var name in TemplateWorksheetNames)
        {
            var sheet = workbook.Worksheets.FirstOrDefault(w => w.Name == name);
            if (sheet is not null)
                return sheet;
        }

        return workbook.Worksheets.Worksheet(1);
    }

    private static string ResolveTemplatePath()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Templates", TemplateFileName);
        if (!File.Exists(path))
        {
            throw new FileNotFoundException(
                "Không tìm thấy file mẫu Excel xuất báo giá. Đảm bảo Templates/BaoGiaExportTemplate.xlsx được copy khi build.",
                path);
        }

        return path;
    }
}
