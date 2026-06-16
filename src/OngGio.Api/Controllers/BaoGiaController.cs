using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OngGio.Application.Services;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;

namespace OngGio.Api.Controllers;

/// <summary>
/// Controller quản lý báo giá, bao gồm CRUD, đổi trạng thái và export Excel.
/// </summary>
[ApiController]
[Route("api/bao-gia")]
public class BaoGiaController : ControllerBase
{
    private readonly IBaoGiaService _baoGiaService;

    public BaoGiaController(IBaoGiaService baoGiaService) => _baoGiaService = baoGiaService;

    /// <summary>
    /// Lấy danh sách tất cả báo giá.
    /// </summary>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Danh sách báo giá.</returns>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _baoGiaService.GetAllAsync(ct));

    /// <summary>
    /// Lấy chi tiết một báo giá theo id.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Chi tiết báo giá hoặc 404 nếu không tìm thấy.</returns>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var item = await _baoGiaService.GetByIdAsync(id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    /// <summary>
    /// Tạo mới một báo giá.
    /// </summary>
    /// <param name="request">Dữ liệu báo giá cần tạo.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Báo giá vừa tạo.</returns>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBaoGiaRequest request, CancellationToken ct)
    {
        var item = await _baoGiaService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    /// <summary>
    /// Cập nhật báo giá theo id.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="request">Dữ liệu cập nhật.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Báo giá sau khi cập nhật.</returns>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateBaoGiaRequest request, CancellationToken ct)
    {
        var item = await _baoGiaService.UpdateAsync(id, request, ct);
        return item is null ? NotFound() : Ok(item);
    }

    /// <summary>
    /// Đổi trạng thái của báo giá.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="request">Trạng thái mới.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Báo giá sau khi đổi trạng thái.</returns>
    [HttpPatch("{id:int}/trang-thai")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request, CancellationToken ct)
    {
        var item = await _baoGiaService.UpdateStatusAsync(id, request.TrangThai, ct);
        return item is null ? NotFound() : Ok(item);
    }

    /// <summary>
    /// Xóa một báo giá theo id.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>NoContent nếu xóa thành công, 404 nếu không tìm thấy.</returns>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var ok = await _baoGiaService.DeleteAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }

    /// <summary>
    /// Xuất báo giá ra file Excel.
    /// </summary>
    /// <param name="id">Mã báo giá.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>File Excel của báo giá.</returns>
    [HttpGet("{id:int}/export-excel")]
    public async Task<IActionResult> ExportExcel(int id, CancellationToken ct)
    {
        try
        {
            var bytes = await _baoGiaService.ExportExcelAsync(id, ct);
            return File(bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"BaoGia_{id}.xlsx");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}

public record UpdateStatusRequest(string TrangThai);
