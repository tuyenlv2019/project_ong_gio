using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;

namespace OngGio.Api.Controllers;

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
        Ok(await _db.NhomSanPhams.Include(x => x.ThamSoCoDinhs).OrderBy(x => x.TenNhom).ToListAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var item = await _db.NhomSanPhams.Include(x => x.ThamSoCoDinhs)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] NhomSanPhamRequest request, CancellationToken ct)
    {
        var item = new NhomSanPham
        {
            TenNhom = request.TenNhom,
            HinhAnhMinhHoa = request.HinhAnhMinhHoa
        };
        _db.NhomSanPhams.Add(item);
        await _db.SaveChangesAsync(ct);

        if (request.ThamSo is { Count: > 0 })
        {
            foreach (var t in request.ThamSo)
            {
                _db.ThamSoCoDinhs.Add(new ThamSoCoDinh
                {
                    NhomSanPhamId = item.Id,
                    TenThamSo = t.TenThamSo,
                    GiaTriSo = t.GiaTriSo
                });
            }
            await _db.SaveChangesAsync(ct);
        }

        return Ok(await _db.NhomSanPhams.Include(x => x.ThamSoCoDinhs)
            .FirstAsync(x => x.Id == item.Id, ct));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] NhomSanPhamRequest request, CancellationToken ct)
    {
        var item = await _db.NhomSanPhams.Include(x => x.ThamSoCoDinhs)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (item is null) return NotFound();

        item.TenNhom = request.TenNhom;
        item.HinhAnhMinhHoa = request.HinhAnhMinhHoa;

        if (request.ThamSo is not null)
        {
            _db.ThamSoCoDinhs.RemoveRange(item.ThamSoCoDinhs);
            item.ThamSoCoDinhs.Clear();
            foreach (var t in request.ThamSo)
            {
                item.ThamSoCoDinhs.Add(new ThamSoCoDinh
                {
                    TenThamSo = t.TenThamSo,
                    GiaTriSo = t.GiaTriSo
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

public record ThamSoRequest(string TenThamSo, decimal GiaTriSo);

public record NhomSanPhamRequest(
    string TenNhom,
    string? HinhAnhMinhHoa,
    List<ThamSoRequest>? ThamSo);
