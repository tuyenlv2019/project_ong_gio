using System.Text.Json;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using OngGio.Application.Calculation;
using OngGio.Application.Services;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;

namespace OngGio.Infrastructure.Services;

public class BaoGiaService : IBaoGiaService
{
    private readonly OngGioDbContext _db;
    private readonly ICalculationEngine _calculationEngine;

    public BaoGiaService(OngGioDbContext db, ICalculationEngine calculationEngine)
    {
        _db = db;
        _calculationEngine = calculationEngine;
    }

    public async Task<CalculationResult> PreviewAsync(CalculationRequest request, CancellationToken ct = default)
    {
        var (nhom, loaiTon, thamSo) = await LoadCalculationDataAsync(request.NhomSanPhamId, request.LoaiTonId, ct);
        return await _calculationEngine.CalculateAsync(nhom, loaiTon, thamSo, request, ct);
    }

    public async Task<BaoGia> CreateAsync(CreateBaoGiaRequest request, CancellationToken ct = default)
    {
        var baoGia = new BaoGia
        {
            MaBaoGia = await GenerateMaBaoGiaAsync(ct),
            TenKhachHang = request.TenKhachHang,
            NgayTao = DateTime.UtcNow,
            ThueSuat = request.ThueSuat,
            TrangThai = "DANG_XU_LY"
        };

        await ApplyLinesAsync(baoGia, request, ct);
        _db.BaoGias.Add(baoGia);
        await _db.SaveChangesAsync(ct);
        return baoGia;
    }

    public async Task<BaoGia?> UpdateAsync(int id, CreateBaoGiaRequest request, CancellationToken ct = default)
    {
        var baoGia = await _db.BaoGias
            .Include(x => x.ChiTietBaoGias)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (baoGia is null) return null;

        baoGia.TenKhachHang = request.TenKhachHang;
        baoGia.ThueSuat = request.ThueSuat;
        _db.ChiTietBaoGias.RemoveRange(baoGia.ChiTietBaoGias);
        baoGia.ChiTietBaoGias.Clear();

        await ApplyLinesAsync(baoGia, request, ct);
        await _db.SaveChangesAsync(ct);
        return baoGia;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var baoGia = await _db.BaoGias
            .Include(x => x.ChiTietBaoGias)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (baoGia is null) return false;

        _db.ChiTietBaoGias.RemoveRange(baoGia.ChiTietBaoGias);
        _db.BaoGias.Remove(baoGia);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<BaoGia?> UpdateStatusAsync(int id, string trangThai, CancellationToken ct = default)
    {
        var baoGia = await _db.BaoGias.FindAsync([id], ct);
        if (baoGia is null) return null;

        baoGia.TrangThai = trangThai;
        await _db.SaveChangesAsync(ct);
        return baoGia;
    }

    public async Task<BaoGia?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.BaoGias
            .Include(x => x.ChiTietBaoGias)
            .ThenInclude(x => x.NhomSanPham)
            .Include(x => x.ChiTietBaoGias)
            .ThenInclude(x => x.LoaiTon)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public async Task<IReadOnlyList<BaoGia>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.BaoGias
            .OrderByDescending(x => x.NgayTao)
            .ToListAsync(ct);
    }

    public async Task<byte[]> ExportExcelAsync(int id, CancellationToken ct = default)
    {
        var baoGia = await GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Khong tim thay bao gia id={id}");

        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("BaoGia");

        sheet.Cell(1, 1).Value = "Ma bao gia";
        sheet.Cell(1, 2).Value = baoGia.MaBaoGia;
        sheet.Cell(2, 1).Value = "Khach hang";
        sheet.Cell(2, 2).Value = baoGia.TenKhachHang;
        sheet.Cell(3, 1).Value = "Trang thai";
        sheet.Cell(3, 2).Value = baoGia.TrangThai;
        sheet.Cell(4, 1).Value = "Ngay tao";
        sheet.Cell(4, 2).Value = baoGia.NgayTao.ToString("dd/MM/yyyy HH:mm");

        var headers = new[]
        {
            "STT", "Ten san pham", "Loai san pham", "Loai ton", "W (mm)", "H (mm)", "Don vi tinh", "SL", "Thue suat",
            "Dien tich SX/cai (m2)", "Tong dien tich (m2)", "Trong luong (kg)",
            "Thanh tien ton", "Don gia", "Thanh tien"
        };
        for (var i = 0; i < headers.Length; i++)
            sheet.Cell(6, i + 1).Value = headers[i];

        var row = 7;
        var stt = 1;
        foreach (var line in baoGia.ChiTietBaoGias)
        {
            sheet.Cell(row, 1).Value = stt++;
            sheet.Cell(row, 2).Value = line.TenSanPham ?? "";
            sheet.Cell(row, 3).Value = line.NhomSanPham?.TenNhom ?? "";
            sheet.Cell(row, 4).Value = $"{line.LoaiTon?.ThuongHieu} {line.LoaiTon?.DoDay}mm";
            sheet.Cell(row, 5).Value = line.WInput;
            sheet.Cell(row, 6).Value = line.HInput;
            sheet.Cell(row, 7).Value = line.DonViTinh;
            sheet.Cell(row, 8).Value = line.SoLuong;
            sheet.Cell(row, 9).Value = line.ThueSuat;
            sheet.Cell(row, 10).Value = line.DienTichSx1Cai;
            sheet.Cell(row, 11).Value = line.TongDienTichLo;
            sheet.Cell(row, 12).Value = line.TrongLuongKg;
            sheet.Cell(row, 13).Value = line.ThanhTienTon;
            sheet.Cell(row, 14).Value = line.DonGiaCuoi;
            sheet.Cell(row, 15).Value = line.ThanhTien;
            row++;
        }

        sheet.Cell(row + 1, 13).Value = "Tong truoc thue:";
        sheet.Cell(row + 1, 15).Value = baoGia.TongTienTruocThue;
        sheet.Cell(row + 2, 13).Value = "Tong sau thue:";
        sheet.Cell(row + 2, 15).Value = baoGia.TongTienSauThue;
        sheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private async Task ApplyLinesAsync(BaoGia baoGia, CreateBaoGiaRequest request, CancellationToken ct)
    {
        decimal tongTruocThue = 0m;
        decimal tongSauThue = 0m;

        foreach (var line in request.Lines)
        {
            var calcRequest = new CalculationRequest(
                line.NhomSanPhamId,
                line.LoaiTonId,
                line.W,
                line.H,
                line.SoLuong,
                line.GiaNhanCong,
                line.PhuKien,
                line.ThamSoNhap);

            var (nhom, loaiTon, thamSo) = await LoadCalculationDataAsync(line.NhomSanPhamId, line.LoaiTonId, ct);
            var result = await _calculationEngine.CalculateAsync(nhom, loaiTon, thamSo, calcRequest, ct);

            baoGia.ChiTietBaoGias.Add(new ChiTietBaoGia
            {
                NhomSanPhamId = line.NhomSanPhamId,
                LoaiTonId = line.LoaiTonId,
                TenSanPham = line.TenSanPham,
                DonViTinh = string.IsNullOrWhiteSpace(line.DonViTinh) ? "cai" : line.DonViTinh,
                WInput = line.W,
                HInput = line.H,
                SoLuong = line.SoLuong,
                ThueSuat = line.ThueSuat,
                GiaNhanCong = line.GiaNhanCong,
                PhuKien = line.PhuKien,
                ThamSoNhapJson = line.ThamSoNhap is { Count: > 0 }
                    ? JsonSerializer.Serialize(line.ThamSoNhap)
                    : null,
                DienTichSx1Cai = result.DienTichSx1Cai,
                TongDienTichLo = result.TongDienTichLo,
                TrongLuongKg = result.TrongLuongKg,
                ThanhTienTon = result.ThanhTienTon,
                DonGiaCuoi = result.DonGiaCuoi,
                ThanhTien = result.ThanhTien,
                TrangThaiCongThuc = result.TrangThaiCongThuc
            });

            tongTruocThue += result.ThanhTien;
            tongSauThue += result.ThanhTien * (1 + line.ThueSuat);
        }

        baoGia.TongTienTruocThue = tongTruocThue;
        baoGia.TongTienSauThue = tongSauThue;
    }

    private async Task<(NhomSanPham nhom, LoaiTon loaiTon, List<ThamSoCoDinh> thamSo)> LoadCalculationDataAsync(
        int nhomSanPhamId, int loaiTonId, CancellationToken ct)
    {
        var nhom = await _db.NhomSanPhams.FirstOrDefaultAsync(x => x.Id == nhomSanPhamId, ct)
            ?? throw new KeyNotFoundException($"Khong tim thay nhom san pham id={nhomSanPhamId}");
        var loaiTon = await _db.LoaiTons.FirstOrDefaultAsync(x => x.Id == loaiTonId, ct)
            ?? throw new KeyNotFoundException($"Khong tim thay loai ton id={loaiTonId}");
        var thamSo = await _db.ThamSoCoDinhs.Where(x => x.NhomSanPhamId == nhomSanPhamId).ToListAsync(ct);
        return (nhom, loaiTon, thamSo);
    }

    private async Task<string> GenerateMaBaoGiaAsync(CancellationToken ct)
    {
        var year = DateTime.UtcNow.Year;
        var count = await _db.BaoGias.CountAsync(x => x.NgayTao.Year == year, ct);
        return $"BG-{year}-{(count + 1):D3}";
    }
}
