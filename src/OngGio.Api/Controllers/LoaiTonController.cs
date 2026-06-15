using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;

namespace OngGio.Api.Controllers;

[ApiController]
[Route("api/loai-ton")]
public class LoaiTonController : ControllerBase
{
    private readonly OngGioDbContext _db;

    public LoaiTonController(OngGioDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _db.LoaiTons.OrderBy(x => x.ThuongHieu).ThenBy(x => x.DoDay).ToListAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var item = await _db.LoaiTons.FindAsync([id], ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] LoaiTonRequest request, CancellationToken ct)
    {
        var item = new LoaiTon
        {
            ThuongHieu = request.ThuongHieu,
            DoDay = request.DoDay,
            DonGiaM2 = request.DonGiaM2,
            GiaSanCoDinh = request.GiaSanCoDinh,
            BangBaremJson = request.BangBaremJson ?? "[]"
        };
        _db.LoaiTons.Add(item);
        await _db.SaveChangesAsync(ct);
        return Ok(item);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] LoaiTonRequest request, CancellationToken ct)
    {
        var item = await _db.LoaiTons.FindAsync([id], ct);
        if (item is null) return NotFound();

        item.ThuongHieu = request.ThuongHieu;
        item.DoDay = request.DoDay;
        item.DonGiaM2 = request.DonGiaM2;
        item.GiaSanCoDinh = request.GiaSanCoDinh;
        item.BangBaremJson = request.BangBaremJson ?? item.BangBaremJson;

        await _db.SaveChangesAsync(ct);
        return Ok(item);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var item = await _db.LoaiTons.FindAsync([id], ct);
        if (item is null) return NotFound();
        _db.LoaiTons.Remove(item);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record LoaiTonRequest(
    string ThuongHieu,
    decimal DoDay,
    decimal DonGiaM2,
    decimal GiaSanCoDinh,
    string? BangBaremJson);
