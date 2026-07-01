using ClosedXML.Excel;
using OngGio.Domain.Entities;

namespace OngGio.Infrastructure.Services;

/// <summary>
/// Xuất báo giá ra Excel theo mẫu Sheet 2 (giữ nguyên header dòng 1–4).
/// </summary>
internal static class BaoGiaExcelExporter
{
    private const string TemplateFileName = "BaoGiaExportTemplate.xlsx";
    private const string OutputWorksheetName = "Báo giá";
    private static readonly string[] TemplateWorksheetNames = ["Báo giá", "Sheet 2"];
    private const int DataStartRow = 5;
    private const int StyleSourceRow = 5;
    private const int FooterStartRow = 6;
    private const int FooterEndRow = 11;

    // Cột nhập liệu (màu vàng nhạt) vs cột tính theo công thức (màu xanh nhạt) theo mẫu Sheet 2.
    private static readonly int[] InputColumns = { 2, 3, 7, 8, 9, 10, 11, 12, 15 };
    private static readonly int[] FormulaColumns = { 4, 5, 6, 13, 14 };
    private const int InputStyleColumn = 11;   // K
    private const int FormulaStyleColumn = 4; // D

    internal static byte[] Export(BaoGia baoGia)
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
        RemoveAllPictures(sheet);

        var lastRow = sheet.LastRowUsed()?.RowNumber() ?? FooterEndRow;
        if (lastRow >= DataStartRow)
            sheet.Rows(DataStartRow, lastRow).Delete();

        var row = DataStartRow;
        var stt = 1;
        foreach (var line in baoGia.ChiTietBaoGias.OrderBy(x => x.Id))
        {
            if (row > DataStartRow)
                sheet.Row(row - 1).InsertRowsBelow(1);

            templateSheet.Row(StyleSourceRow).CopyTo(sheet.Row(row));
            WriteLineRow(sheet, row, stt++, line);
            ApplyRowCellColors(sheet, templateSheet, row);
            row++;
        }

        if (baoGia.ChiTietBaoGias.Count > 0)
        {
            sheet.Cell(row, 13).Value = "Tổng cộng:";
            sheet.Cell(row, 13).Style.Font.Bold = true;
            sheet.Cell(row, 14).Value = baoGia.TongTienTruocThue;
            sheet.Cell(row, 14).Style.Font.Bold = true;
            row++;
        }

        row++;
        var footerTargetRow = row;
        for (var footerRow = FooterStartRow; footerRow <= FooterEndRow; footerRow++)
        {
            templateSheet.Row(footerRow).CopyTo(sheet.Row(footerTargetRow + (footerRow - FooterStartRow)));
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void RemoveAllPictures(IXLWorksheet sheet)
    {
        foreach (var picture in sheet.Pictures.ToList())
            picture.Delete();
    }

    private static void WriteLineRow(IXLWorksheet sheet, int row, int stt, ChiTietBaoGia line)
    {
        var loaiTon = line.LoaiTon;
        var nhom = line.NhomSanPham;
        var dienTichMetToi = line.DienTichSx1Cai / 1.2m;

        sheet.Cell(row, 1).Value = stt;
        sheet.Cell(row, 2).Value = line.TenSanPham ?? nhom?.TenNhom ?? "";
        sheet.Cell(row, 3).Value = loaiTon is null
            ? ""
            : $"{loaiTon.ThuongHieu}/ {loaiTon.DoDay} mm";
        sheet.Cell(row, 4).Value = line.DienTichSx1Cai;
        sheet.Cell(row, 5).Value = dienTichMetToi;
        sheet.Cell(row, 6).Value = line.TrongLuongKg;
        sheet.Cell(row, 7).Value = line.ThanhTienTon;
        sheet.Cell(row, 8).Value = line.GiaNhanCong;
        sheet.Cell(row, 9).Value = line.PhuKien;
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
