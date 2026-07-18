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
        Ok(await _db.LoaiTons
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .ToListAsync(ct));

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
        if (!TryNormalize(request, out var normalized, out var error))
            return BadRequest(new { message = error });

        if (await ExistsDuplicateAsync(normalized, excludeId: null, ct))
        {
            return Conflict(new
            {
                message = "Đã tồn tại loại tôn trùng Thương hiệu, Độ dày (mm) và Độ mạ vật liệu."
            });
        }

        var item = new LoaiTon
        {
            ThuongHieu = normalized.ThuongHieu,
            DoDay = normalized.DoDay,
            DoMaVatLieu = normalized.DoMaVatLieu,
            DonGiaMetToi = normalized.DonGiaMetToi,
            KgMoiMetToi = normalized.KgMoiMetToi
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

        if (!TryNormalize(request, out var normalized, out var error))
            return BadRequest(new { message = error });

        if (await ExistsDuplicateAsync(normalized, excludeId: id, ct))
        {
            return Conflict(new
            {
                message = "Đã tồn tại loại tôn trùng Thương hiệu, Độ dày (mm) và Độ mạ vật liệu."
            });
        }

        item.ThuongHieu = normalized.ThuongHieu;
        item.DoDay = normalized.DoDay;
        item.DoMaVatLieu = normalized.DoMaVatLieu;
        item.DonGiaMetToi = normalized.DonGiaMetToi;
        item.KgMoiMetToi = normalized.KgMoiMetToi;

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

    private async Task<bool> ExistsDuplicateAsync(
        LoaiTonRequest normalized,
        int? excludeId,
        CancellationToken ct)
    {
        var thuongHieuKey = normalized.ThuongHieu.ToLowerInvariant();
        var doMaKey = normalized.DoMaVatLieu.ToLowerInvariant();

        return await _db.LoaiTons.AnyAsync(
            x => (excludeId == null || x.Id != excludeId)
                && x.ThuongHieu.ToLower() == thuongHieuKey
                && x.DoDay == normalized.DoDay
                && x.DoMaVatLieu.ToLower() == doMaKey,
            ct);
    }

    private static bool TryNormalize(
        LoaiTonRequest request,
        out LoaiTonRequest normalized,
        out string error)
    {
        var thuongHieu = request.ThuongHieu?.Trim() ?? "";
        var doMaVatLieu = request.DoMaVatLieu?.Trim() ?? "";

        if (string.IsNullOrWhiteSpace(thuongHieu))
        {
            normalized = request;
            error = "Thương hiệu là bắt buộc.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(doMaVatLieu))
        {
            normalized = request;
            error = "Độ mạ vật liệu là bắt buộc.";
            return false;
        }

        normalized = request with
        {
            ThuongHieu = thuongHieu,
            DoMaVatLieu = doMaVatLieu,
        };
        error = "";
        return true;
    }
}

public record LoaiTonRequest(
    string ThuongHieu,
    decimal DoDay,
    string DoMaVatLieu,
    decimal DonGiaMetToi,
    decimal KgMoiMetToi);
