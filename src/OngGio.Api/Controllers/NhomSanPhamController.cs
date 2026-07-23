using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;

namespace OngGio.Api.Controllers;

internal static class ThamSoFormValidator
{
    private static readonly HashSet<string> FormulaKeywords = new(StringComparer.OrdinalIgnoreCase)
    {
        "if", "sqrt", "min", "max", "abs", "and", "or", "not", "true", "false"
    };

    internal static void EnsureUnique(IReadOnlyList<ThamSoRequest>? thamSo)
    {
        if (thamSo is null or { Count: 0 })
            return;

        var seen = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var t in thamSo)
        {
            var name = t.TenThamSo?.Trim();
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Tên tham số không được để trống");

            var bindingKey = GetBindingKey(name);
            if (seen.TryGetValue(bindingKey, out var existing))
            {
                throw new ArgumentException(
                    $"Tham số '{name}' trùng với '{existing}' trên form đơn hàng");
            }

            seen[bindingKey] = name;
        }
    }

    /// <summary>
    /// Mỗi tham số form phải xuất hiện trong công thức ∑Ssx — không cho lưu tham số thừa.
    /// </summary>
    internal static void EnsureUsedInFormula(IReadOnlyList<ThamSoRequest>? thamSo, string? congThucDienTich)
    {
        if (thamSo is null or { Count: 0 })
            return;

        var names = thamSo
            .Select(t => t.TenThamSo?.Trim())
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Cast<string>()
            .ToList();
        if (names.Count == 0)
            return;

        var formula = congThucDienTich?.Trim() ?? string.Empty;
        if (formula.Length == 0)
        {
            throw new ArgumentException(
                $"Các tham số chưa có trong công thức: {string.Join(", ", names)}. Mỗi tham số trên form phải xuất hiện trong công thức ∑Ssx.");
        }

        var formulaIds = ExtractFormulaIdentifiers(formula);
        var missing = names.Where(n => !IsParamUsedInFormula(n, formulaIds)).ToList();
        if (missing.Count == 0)
            return;

        throw new ArgumentException(
            $"Tham số không có trong công thức ∑Ssx: {string.Join(", ", missing)}. Bỏ khỏi form hoặc bổ sung vào công thức.");
    }

    private static HashSet<string> ExtractFormulaIdentifiers(string formula)
    {
        var ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (System.Text.RegularExpressions.Match match in
                 System.Text.RegularExpressions.Regex.Matches(formula, @"[A-Za-z_][A-Za-z0-9_]*"))
        {
            if (!FormulaKeywords.Contains(match.Value))
                ids.Add(match.Value);
        }
        return ids;
    }

    private static bool IsParamUsedInFormula(string tenThamSo, HashSet<string> formulaIds)
    {
        var name = tenThamSo.Trim();
        if (string.Equals(name, "W", StringComparison.OrdinalIgnoreCase)
            || string.Equals(name, "Wmax", StringComparison.OrdinalIgnoreCase))
        {
            return formulaIds.Contains("W") || formulaIds.Contains("Wmax");
        }

        if (string.Equals(name, "H", StringComparison.OrdinalIgnoreCase)
            || string.Equals(name, "Hmax", StringComparison.OrdinalIgnoreCase))
        {
            return formulaIds.Contains("H") || formulaIds.Contains("Hmax");
        }

        return formulaIds.Contains(name);
    }

    /// <summary>
    /// Placeholder trong mẫu tên phải có trên danh sách tham số form (trừ {TenNhom}).
    /// </summary>
    internal static void EnsureMauTenPlaceholdersInThamSo(
        string? mauTenSanPham,
        IReadOnlyList<ThamSoRequest>? thamSo)
    {
        var template = mauTenSanPham?.Trim() ?? string.Empty;
        if (template.Length == 0)
            return;

        var placeholders = System.Text.RegularExpressions.Regex.Matches(template, @"\{([^{}]+)\}")
            .Select(m => m.Groups[1].Value.Trim())
            .Where(p => p.Length > 0)
            .ToList();
        if (placeholders.Count == 0)
            return;

        var formParams = new HashSet<string>(
            (thamSo ?? [])
                .Select(t => t.TenThamSo?.Trim())
                .Where(n => !string.IsNullOrWhiteSpace(n))
                .Cast<string>(),
            StringComparer.OrdinalIgnoreCase);

        var missing = placeholders
            .Where(p => !IsMauTenPlaceholderAvailable(p, formParams))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (missing.Count == 0)
            return;

        throw new ArgumentException(
            $"Mẫu tên dùng tham số không có trên form: {string.Join(", ", missing.Select(p => $"{{{p}}}"))}. Thêm vào tham số form hoặc sửa mẫu tên.");
    }

    private static bool IsMauTenPlaceholderAvailable(string placeholder, HashSet<string> formParams)
    {
        var key = placeholder.Trim();
        if (string.Equals(key, "TenNhom", StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.Equals(key, "W", StringComparison.OrdinalIgnoreCase)
            || string.Equals(key, "W1", StringComparison.OrdinalIgnoreCase)
            || string.Equals(key, "Wmax", StringComparison.OrdinalIgnoreCase))
        {
            return formParams.Contains("W") || formParams.Contains("Wmax") || formParams.Contains("W1");
        }

        if (string.Equals(key, "H", StringComparison.OrdinalIgnoreCase)
            || string.Equals(key, "H1", StringComparison.OrdinalIgnoreCase)
            || string.Equals(key, "Hmax", StringComparison.OrdinalIgnoreCase))
        {
            return formParams.Contains("H") || formParams.Contains("Hmax") || formParams.Contains("H1");
        }

        if (string.Equals(key, "N", StringComparison.OrdinalIgnoreCase)
            || string.Equals(key, "DO_LECH", StringComparison.OrdinalIgnoreCase))
        {
            return formParams.Contains("N") || formParams.Contains("DO_LECH");
        }

        return formParams.Contains(key);
    }

    private static string GetBindingKey(string tenThamSo)
    {
        var normalized = tenThamSo.Trim().ToLowerInvariant();
        if (normalized is "w" or "wmax") return "w";
        if (normalized is "h" or "hmax") return "h";
        return $"thamSoNhap:{normalized}";
    }
}

/// <summary>
/// Controller quản lý nhóm sản phẩm và các tham số cố định đi kèm.
/// </summary>
[ApiController]
[Route("api/nhom-san-pham")]
public class NhomSanPhamController : ControllerBase
{
    private readonly OngGioDbContext _db;

    public NhomSanPhamController(OngGioDbContext db) => _db = db;

    /// <summary>
    /// Lấy danh sách nhóm sản phẩm kèm tham số cố định.
    /// </summary>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Danh sách nhóm sản phẩm.</returns>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _db.NhomSanPhams
            .Include(x => x.ThamSoCoDinhs.OrderBy(t => t.ThuTu))
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .ToListAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var item = await _db.NhomSanPhams
            .Include(x => x.ThamSoCoDinhs.OrderBy(t => t.ThuTu))
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    /// <summary>
    /// Tải ảnh minh họa sản phẩm lên server.
    /// </summary>
    /// <param name="file">File ảnh.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Đường dẫn public của ảnh vừa tải lên.</returns>
    [HttpPost("upload-image")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage(IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Chưa chọn file ảnh" });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not (".jpg" or ".jpeg" or ".png" or ".gif" or ".webp"))
            return BadRequest(new { message = "Chỉ hỗ trợ ảnh JPG, PNG, GIF hoặc WEBP" });

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "Ảnh không được vượt quá 5MB" });

        var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "uploads");
        Directory.CreateDirectory(uploadDir);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadDir, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream, ct);
        }

        return Ok(new { path = $"/images/uploads/{fileName}" });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] NhomSanPhamRequest request, CancellationToken ct)
    {
        var isAdmin = AuthClaims.IsAdmin(User);
        if (!isAdmin && !string.IsNullOrWhiteSpace(request.CongThucDienTich))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = "Chỉ tài khoản ADMIN mới được nhập/sửa công thức tính diện tích."
            });
        }

        try
        {
            ThamSoFormValidator.EnsureUnique(request.ThamSo);
            ThamSoFormValidator.EnsureUsedInFormula(
                request.ThamSo,
                isAdmin ? request.CongThucDienTich : null);
            ThamSoFormValidator.EnsureMauTenPlaceholdersInThamSo(
                request.MauTenSanPham,
                request.ThamSo);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        var item = new NhomSanPham
        {
            TenNhom = request.TenNhom,
            HinhAnhMinhHoa = request.HinhAnhMinhHoa,
            CongThucDienTich = isAdmin ? request.CongThucDienTich : null,
            MauTenSanPham = string.IsNullOrWhiteSpace(request.MauTenSanPham)
                ? null
                : request.MauTenSanPham.Trim()
        };
        _db.NhomSanPhams.Add(item);
        await _db.SaveChangesAsync(ct);

        if (request.ThamSo is { Count: > 0 })
        {
            for (var i = 0; i < request.ThamSo.Count; i++)
            {
                var t = request.ThamSo[i];
                _db.ThamSoCoDinhs.Add(new ThamSoCoDinh
                {
                    NhomSanPhamId = item.Id,
                    TenThamSo = t.TenThamSo,
                    GiaTriSo = 0,
                    ThuTu = i
                });
            }
            await _db.SaveChangesAsync(ct);
        }

        return Ok(await _db.NhomSanPhams
            .Include(x => x.ThamSoCoDinhs.OrderBy(t => t.ThuTu))
            .FirstAsync(x => x.Id == item.Id, ct));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] NhomSanPhamRequest request, CancellationToken ct)
    {
        var item = await _db.NhomSanPhams.Include(x => x.ThamSoCoDinhs)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (item is null) return NotFound();

        var isAdmin = AuthClaims.IsAdmin(User);
        // Công thức tính: chỉ ADMIN được sửa; nhân viên giữ nguyên giá trị hiện có.
        if (!isAdmin)
        {
            var incoming = (request.CongThucDienTich ?? string.Empty).Trim();
            var current = (item.CongThucDienTich ?? string.Empty).Trim();
            if (!string.Equals(incoming, current, StringComparison.Ordinal))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = "Chỉ tài khoản ADMIN mới được sửa công thức tính diện tích."
                });
            }
        }

        var formulaForCheck = isAdmin ? request.CongThucDienTich : item.CongThucDienTich;
        try
        {
            ThamSoFormValidator.EnsureUnique(request.ThamSo);
            ThamSoFormValidator.EnsureUsedInFormula(request.ThamSo, formulaForCheck);
            ThamSoFormValidator.EnsureMauTenPlaceholdersInThamSo(
                request.MauTenSanPham,
                request.ThamSo);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        item.TenNhom = request.TenNhom;
        item.HinhAnhMinhHoa = request.HinhAnhMinhHoa;
        item.MauTenSanPham = string.IsNullOrWhiteSpace(request.MauTenSanPham)
            ? null
            : request.MauTenSanPham.Trim();

        if (isAdmin)
        {
            item.CongThucDienTich = request.CongThucDienTich;
        }

        if (request.ThamSo is not null)
        {
            _db.ThamSoCoDinhs.RemoveRange(item.ThamSoCoDinhs);
            item.ThamSoCoDinhs.Clear();
            for (var i = 0; i < request.ThamSo.Count; i++)
            {
                var t = request.ThamSo[i];
                item.ThamSoCoDinhs.Add(new ThamSoCoDinh
                {
                    TenThamSo = t.TenThamSo,
                    GiaTriSo = 0,
                    ThuTu = i
                });
            }
        }

        await _db.SaveChangesAsync(ct);
        return Ok(item);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var item = await _db.NhomSanPhams.Include(x => x.ThamSoCoDinhs)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (item is null) return NotFound();

        // If the product had an uploaded image, attempt to delete the file from disk
        if (!string.IsNullOrWhiteSpace(item.HinhAnhMinhHoa)
            && item.HinhAnhMinhHoa.StartsWith("/images/uploads/", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var fileName = item.HinhAnhMinhHoa.Substring("/images/uploads/".Length);
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "uploads", fileName);
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
            }
            catch
            {
                // ignore failures to delete file; do not prevent DB deletion
            }
        }

        _db.ThamSoCoDinhs.RemoveRange(item.ThamSoCoDinhs);
        _db.NhomSanPhams.Remove(item);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record ThamSoRequest(string TenThamSo);

public record NhomSanPhamRequest(
    string TenNhom,
    string? HinhAnhMinhHoa,
    string? CongThucDienTich,
    string? MauTenSanPham,
    List<ThamSoRequest>? ThamSo);
