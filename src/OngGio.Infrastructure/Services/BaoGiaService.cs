using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OngGio.Application.Calculation;
using OngGio.Application.Services;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;

namespace OngGio.Infrastructure.Services;

/// <summary>
/// Service nghiệp vụ báo giá: preview, CRUD, tổng hợp tiền và export Excel.
/// </summary>
public class BaoGiaService : IBaoGiaService
{
    private readonly OngGioDbContext _db;
    private readonly ICalculationEngine _calculationEngine;

    public BaoGiaService(OngGioDbContext db, ICalculationEngine calculationEngine)
    {
        _db = db;
        _calculationEngine = calculationEngine;
    }

    /// <summary>
    /// Tính thử một dòng báo giá để frontend preview kết quả.
    /// </summary>
    /// <param name="request">Dữ liệu đầu vào của dòng báo giá.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Kết quả tính toán preview.</returns>
    public async Task<CalculationResult> PreviewAsync(CalculationRequest request, CancellationToken ct = default)
    {
        var (nhom, loaiTon, thamSo) = await LoadCalculationDataAsync(request.NhomSanPhamId, request.LoaiTonId, ct);
        EnsureDimensionsAreComplete(nhom, thamSo, request);
        return await _calculationEngine.CalculateAsync(nhom, loaiTon, thamSo, request, ct);
    }

    /// <summary>
    /// Tạo mới báo giá và tính toàn bộ dòng chi tiết.
    /// </summary>
    /// <param name="request">Dữ liệu báo giá cần tạo.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Báo giá vừa được tạo.</returns>
    public async Task<BaoGia> CreateAsync(CreateBaoGiaRequest request, CancellationToken ct = default)
    {
        const int maxAttempts = 5;
        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            var baoGia = new BaoGia
            {
                MaBaoGia = await GenerateMaBaoGiaAsync(ct),
                TenKhachHang = request.TenKhachHang,
                NgayTao = DateTime.UtcNow,
                ThueSuat = request.ThueSuat,
                TrangThai = NormalizeTrangThai(request.TrangThai)
            };

            await ApplyLinesAsync(baoGia, request, ct);
            _db.BaoGias.Add(baoGia);

            try
            {
                await _db.SaveChangesAsync(ct);
                return baoGia;
            }
            catch (DbUpdateException) when (attempt < maxAttempts - 1)
            {
                DetachBaoGia(baoGia);
            }
        }

        throw new InvalidOperationException("Không thể tạo mã báo giá duy nhất. Vui lòng thử lại.");
    }

    /// <summary>
    /// Cập nhật thông tin báo giá và tính lại các dòng chi tiết.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="request">Dữ liệu cập nhật.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Báo giá sau khi cập nhật, hoặc null nếu không tìm thấy.</returns>
    public async Task<BaoGia?> UpdateAsync(int id, CreateBaoGiaRequest request, CancellationToken ct = default)
    {
        var baoGia = await _db.BaoGias
            .Include(x => x.ChiTietBaoGias)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (baoGia is null) return null;

        baoGia.TenKhachHang = request.TenKhachHang;
        baoGia.ThueSuat = request.ThueSuat;
        baoGia.TrangThai = NormalizeTrangThai(request.TrangThai);
        _db.ChiTietBaoGias.RemoveRange(baoGia.ChiTietBaoGias);
        baoGia.ChiTietBaoGias.Clear();

        await ApplyLinesAsync(baoGia, request, ct);
        _db.Entry(baoGia).State = EntityState.Modified;
        await _db.SaveChangesAsync(ct);
        return baoGia;
    }

    /// <summary>
    /// Xóa báo giá và toàn bộ chi tiết liên quan.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>True nếu xóa thành công, ngược lại false.</returns>
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

    /// <summary>
    /// Cập nhật trạng thái báo giá.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="trangThai">Trạng thái mới.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Báo giá sau khi đổi trạng thái, hoặc null nếu không tìm thấy.</returns>
    public async Task<BaoGia?> UpdateStatusAsync(int id, string trangThai, CancellationToken ct = default)
    {
        var baoGia = await _db.BaoGias.FindAsync([id], ct);
        if (baoGia is null) return null;

        baoGia.TrangThai = NormalizeTrangThai(trangThai);
        _db.Entry(baoGia).State = EntityState.Modified;
        await _db.SaveChangesAsync(ct);
        return baoGia;
    }

    /// <summary>
    /// Lấy báo giá theo id kèm toàn bộ chi tiết và dữ liệu liên quan.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Báo giá đầy đủ hoặc null nếu không tìm thấy.</returns>
    public async Task<BaoGia?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.BaoGias
            .Include(x => x.ChiTietBaoGias)
            .ThenInclude(x => x.NhomSanPham)
            .Include(x => x.ChiTietBaoGias)
            .ThenInclude(x => x.LoaiTon)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    /// <summary>
    /// Lấy toàn bộ báo giá theo thứ tự mới nhất trước.
    /// </summary>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Danh sách báo giá.</returns>
    public async Task<IReadOnlyList<BaoGia>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.BaoGias
            .AsNoTracking()
            .OrderByDescending(x => x.NgayTao)
            .Select(x => new BaoGia
            {
                Id = x.Id,
                MaBaoGia = x.MaBaoGia,
                TenKhachHang = x.TenKhachHang,
                NgayTao = x.NgayTao,
                ThueSuat = x.ThueSuat,
                TongTienTruocThue = x.TongTienTruocThue,
                TongTienSauThue = x.TongTienSauThue,
                TrangThai = x.TrangThai,
                CreatedBy = x.CreatedBy,
                CreatedAt = x.CreatedAt,
                UpdatedBy = x.UpdatedBy,
                UpdatedAt = x.UpdatedAt,
                TongSoSanPham = x.ChiTietBaoGias.Sum(c => c.SoLuong),
            })
            .ToListAsync(ct);
    }

    /// <summary>
    /// Xuất báo giá ra file Excel để tải về.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Mảng byte của file Excel.</returns>
    public async Task<byte[]> ExportExcelAsync(int id, CancellationToken ct = default)
    {
        var baoGia = await GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Khong tim thay bao gia id={id}");

        return BaoGiaExcelExporter.Export(baoGia);
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
            EnsureDimensionsAreComplete(nhom, thamSo, calcRequest);
            var result = await _calculationEngine.CalculateAsync(nhom, loaiTon, thamSo, calcRequest, ct);

            // Ưu tiên sử dụng Giá tôn do người dùng nhập, nếu không có mới dùng kết quả tính toán tự động
            var finalThanhTienTon = line.ThanhTienTon > 0
                ? Math.Round(line.ThanhTienTon, 0, MidpointRounding.AwayFromZero)
                : result.ThanhTienTon;
            var adjustedThanhTien = result.ThanhTien + (finalThanhTienTon - result.ThanhTienTon);
            var donGiaCuoi = line.SoLuong > 0
                ? Math.Round(adjustedThanhTien / line.SoLuong, 0, MidpointRounding.AwayFromZero)
                : 0m;
            var finalThanhTien = donGiaCuoi * line.SoLuong;

            baoGia.ChiTietBaoGias.Add(new ChiTietBaoGia
            {
                NhomSanPhamId = line.NhomSanPhamId,
                LoaiTonId = line.LoaiTonId,
                TenSanPham = line.TenSanPham,
                GhiChu = line.GhiChu,
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
                ThanhTienTon = finalThanhTienTon,
                DonGiaCuoi = donGiaCuoi,
                ThanhTien = finalThanhTien,
                TrangThaiCongThuc = result.TrangThaiCongThuc
            });

            tongTruocThue += finalThanhTien;
            tongSauThue += finalThanhTien * (1 + line.ThueSuat);
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
        var thamSo = await _db.ThamSoCoDinhs
            .Where(x => x.NhomSanPhamId == nhomSanPhamId)
            .OrderBy(x => x.ThuTu)
            .ToListAsync(ct);
        return (nhom, loaiTon, thamSo);
    }

    private static void EnsureDimensionsAreComplete(
        NhomSanPham nhom,
        IReadOnlyList<ThamSoCoDinh> thamSoList,
        CalculationRequest request)
    {
        var keys = thamSoList
            .Select(x => x.TenThamSo)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToArray();

        if (keys.Length == 0)
        {
            throw new ArgumentException(
                $"Nhóm sản phẩm '{nhom.TenNhom}' chưa cấu hình tham số nhập. Cập nhật tại Quản lý sản phẩm.");
        }

        EnsureUniqueThamSo(nhom, thamSoList);

        if (string.IsNullOrWhiteSpace(nhom.CongThucDienTich))
        {
            throw new ArgumentException(
                $"Nhóm sản phẩm '{nhom.TenNhom}' chưa có công thức diện tích. Cập nhật tại Quản lý sản phẩm.");
        }

        var missing = keys
            .Where(key => !HasDimensionValue(request, key))
            .ToArray();

        if (missing.Length > 0)
        {
            throw new ArgumentException(
                $"Vui lòng nhập đủ kích thước (mm) trước khi tính công thức. Thiếu: {string.Join(", ", missing)}");
        }
    }

    private static void EnsureUniqueThamSo(NhomSanPham nhom, IReadOnlyList<ThamSoCoDinh> thamSoList)
    {
        var seen = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var t in thamSoList)
        {
            var name = t.TenThamSo?.Trim();
            if (string.IsNullOrWhiteSpace(name))
                continue;

            var bindingKey = GetThamSoBindingKey(name);
            if (seen.TryGetValue(bindingKey, out var existing))
            {
                throw new ArgumentException(
                    $"Nhóm sản phẩm '{nhom.TenNhom}': tham số '{name}' trùng với '{existing}' trên form đơn hàng. Cập nhật tại Quản lý sản phẩm.");
            }

            seen[bindingKey] = name;
        }
    }

    private static string GetThamSoBindingKey(string tenThamSo)
    {
        var normalized = tenThamSo.Trim().ToLowerInvariant();
        if (normalized is "w" or "wmax") return "w";
        if (normalized is "h" or "hmax") return "h";
        return $"thamSoNhap:{normalized}";
    }

    private static bool HasDimensionValue(CalculationRequest request, string key)
    {
        var normalized = key.Trim();
        if (string.Equals(normalized, "w", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(normalized, "wmax", StringComparison.OrdinalIgnoreCase))
            return request.W > 0;

        if (string.Equals(normalized, "h", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(normalized, "hmax", StringComparison.OrdinalIgnoreCase))
            return request.H > 0;

        return request.ThamSoNhap is not null &&
               request.ThamSoNhap.Any(x =>
                   string.Equals(x.Key, normalized, StringComparison.OrdinalIgnoreCase) && x.Value > 0);
    }

    private async Task<string> GenerateMaBaoGiaAsync(CancellationToken ct)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"BG-{year}-";

        var existingCodes = await _db.BaoGias
            .AsNoTracking()
            .Where(x => x.MaBaoGia.StartsWith(prefix))
            .Select(x => x.MaBaoGia)
            .ToListAsync(ct);

        var nextSequence = existingCodes
            .Select(ParseMaBaoGiaSequence)
            .DefaultIfEmpty(0)
            .Max() + 1;

        for (var offset = 0; offset < 1000; offset++)
        {
            var candidate = $"{prefix}{(nextSequence + offset):D3}";
            if (!await _db.BaoGias.AsNoTracking().AnyAsync(x => x.MaBaoGia == candidate, ct))
                return candidate;
        }

        throw new InvalidOperationException("Không thể sinh mã báo giá duy nhất.");
    }

    private static int ParseMaBaoGiaSequence(string maBaoGia)
    {
        var lastDash = maBaoGia.LastIndexOf('-');
        if (lastDash < 0 || lastDash >= maBaoGia.Length - 1)
            return 0;

        return int.TryParse(maBaoGia[(lastDash + 1)..], out var sequence) ? sequence : 0;
    }

    private void DetachBaoGia(BaoGia baoGia)
    {
        foreach (var line in baoGia.ChiTietBaoGias.ToList())
        {
            if (_db.Entry(line).State != EntityState.Detached)
                _db.Entry(line).State = EntityState.Detached;
        }

        if (_db.Entry(baoGia).State != EntityState.Detached)
            _db.Entry(baoGia).State = EntityState.Detached;
    }

    private static string NormalizeTrangThai(string? trangThai) =>
        OrderStatusNormalizer.Normalize(trangThai);

    /// <inheritdoc />
    public async Task<IReadOnlyList<BaoGiaLineHistoryDto>> SearchLineHistoryAsync(
        string? search,
        int limit = 100,
        CancellationToken ct = default)
    {
        limit = Math.Clamp(limit, 1, 200);
        var query = _db.ChiTietBaoGias
            .AsNoTracking()
            .Where(x => x.TenSanPham != null && x.TenSanPham.Trim() != "");

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = $"%{search.Trim()}%";
            query = query.Where(x =>
                EF.Functions.Like(x.TenSanPham!, term) ||
                EF.Functions.Like(x.BaoGia.TenKhachHang, term) ||
                EF.Functions.Like(x.BaoGia.MaBaoGia, term) ||
                EF.Functions.Like(x.NhomSanPham.TenNhom, term) ||
                (x.GhiChu != null && EF.Functions.Like(x.GhiChu, term)));
        }

        return await query
            .OrderByDescending(x => x.UpdatedAt)
            .ThenByDescending(x => x.Id)
            .Take(limit)
            .Select(x => new BaoGiaLineHistoryDto(
                x.Id,
                x.TenSanPham!,
                x.BaoGia.MaBaoGia,
                x.BaoGia.TenKhachHang,
                x.BaoGia.NgayTao,
                x.NhomSanPhamId,
                x.NhomSanPham.TenNhom,
                x.LoaiTonId,
                x.LoaiTon.ThuongHieu + " " + x.LoaiTon.DoDay.ToString() + "mm",
                x.WInput,
                x.HInput,
                x.ThamSoNhapJson,
                x.SoLuong,
                x.DonViTinh,
                x.ThueSuat,
                x.GiaNhanCong,
                x.PhuKien,
                x.ThanhTienTon,
                x.GhiChu))
            .ToListAsync(ct);
    }
}
