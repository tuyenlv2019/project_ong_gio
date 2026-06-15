using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OngGio.Application.Services;
using OngGio.Domain.Entities;
using OngGio.Infrastructure.Persistence;

namespace OngGio.Api.Controllers;

[ApiController]
[Route("api/bao-gia")]
public class BaoGiaController : ControllerBase
{
    private readonly IBaoGiaService _baoGiaService;

    public BaoGiaController(IBaoGiaService baoGiaService) => _baoGiaService = baoGiaService;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _baoGiaService.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var item = await _baoGiaService.GetByIdAsync(id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBaoGiaRequest request, CancellationToken ct)
    {
        var item = await _baoGiaService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateBaoGiaRequest request, CancellationToken ct)
    {
        var item = await _baoGiaService.UpdateAsync(id, request, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPatch("{id:int}/trang-thai")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request, CancellationToken ct)
    {
        var item = await _baoGiaService.UpdateStatusAsync(id, request.TrangThai, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var ok = await _baoGiaService.DeleteAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }

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
