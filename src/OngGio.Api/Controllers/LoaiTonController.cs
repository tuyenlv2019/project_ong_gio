using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;

namespace OngGio.Api.Controllers;

/// <summary>
/// Controller quản lý loại tôn.
/// </summary>
[ApiController]
[Route("api/loai-ton")]
public class LoaiTonController : ControllerBase
{
    private readonly OngGioDbContext _db;

    public LoaiTonController(OngGioDbContext db) => _db = db;

    /// <summary>
    /// Lấy toàn bộ danh sách loại tôn.
    /// </summary>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Danh sách loại tôn.</returns>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _db.LoaiTons.OrderBy(x => x.ThuongHieu).ThenBy(x => x.DoDay).ToListAsync(ct));

    /// <summary>
    /// Lấy chi tiết một loại tôn theo id.
    /// </summary>
    /// <param name="id">Mã loại tôn.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Loại tôn hoặc 404 nếu không tìm thấy.</returns>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var item = await _db.LoaiTons.FindAsync([id], ct);
        return item is null ? NotFound() : Ok(item);
    }

    /// <summary>
    /// Tạo mới loại tôn.
    /// </summary>
    /// <param name="request">Dữ liệu loại tôn cần tạo.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Loại tôn vừa tạo.</returns>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] LoaiTonRequest request, CancellationToken ct)
    {
        var item = new LoaiTon
        {
            ThuongHieu = request.ThuongHieu,
            DoDay = request.DoDay,
            DonGiaM2 = request.DonGiaM2,
            KgMoiMetToi = request.KgMoiMetToi
        };
        _db.LoaiTons.Add(item);
        await _db.SaveChangesAsync(ct);
        return Ok(item);
    }

    /// <summary>
    /// Cập nhật loại tôn theo id.
    /// </summary>
    /// <param name="id">Mã loại tôn.</param>
    /// <param name="request">Dữ liệu cập nhật.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Loại tôn sau cập nhật.</returns>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] LoaiTonRequest request, CancellationToken ct)
    {
        var item = await _db.LoaiTons.FindAsync([id], ct);
        if (item is null) return NotFound();

        item.ThuongHieu = request.ThuongHieu;
        item.DoDay = request.DoDay;
        item.DonGiaM2 = request.DonGiaM2;
        item.KgMoiMetToi = request.KgMoiMetToi;

        await _db.SaveChangesAsync(ct);
        return Ok(item);
    }

    /// <summary>
    /// Xóa loại tôn theo id.
    /// </summary>
    /// <param name="id">Mã loại tôn.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>NoContent nếu xóa thành công, 404 nếu không tìm thấy.</returns>
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
    decimal KgMoiMetToi);
