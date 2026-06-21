using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;

namespace OngGio.Api.Controllers;

internal static class ThamSoFormValidator
{
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
            .OrderBy(x => x.TenNhom)
            .ToListAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var item = await _db.NhomSanPhams
            .Include(x => x.ThamSoCoDinhs.OrderBy(t => t.ThuTu))
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] NhomSanPhamRequest request, CancellationToken ct)
    {
        try
        {
            ThamSoFormValidator.EnsureUnique(request.ThamSo);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        var item = new NhomSanPham
        {
            TenNhom = request.TenNhom,
            HinhAnhMinhHoa = request.HinhAnhMinhHoa,
            CongThucDienTich = request.CongThucDienTich
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
        try
        {
            ThamSoFormValidator.EnsureUnique(request.ThamSo);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        var item = await _db.NhomSanPhams.Include(x => x.ThamSoCoDinhs)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (item is null) return NotFound();

        item.TenNhom = request.TenNhom;
        item.HinhAnhMinhHoa = request.HinhAnhMinhHoa;
        item.CongThucDienTich = request.CongThucDienTich;

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
    List<ThamSoRequest>? ThamSo);
