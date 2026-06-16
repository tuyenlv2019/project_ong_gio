using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OngGio.Application.Calculation;
using OngGio.Application.Services;
using OngGio.Infrastructure.Persistence;

namespace OngGio.Api.Controllers;

/// <summary>
/// Controller preview tính toán báo giá theo từng dòng sản phẩm.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CalculationController : ControllerBase
{
    private readonly IBaoGiaService _baoGiaService;

    public CalculationController(IBaoGiaService baoGiaService)
    {
        _baoGiaService = baoGiaService;
    }

    /// <summary>
    /// Tính thử kết quả của một dòng báo giá mà không lưu dữ liệu.
    /// </summary>
    /// <param name="request">Dữ liệu đầu vào cho công thức tính toán.</param>
    /// <param name="ct">Cancellation token của request.</param>
    /// <returns>Kết quả preview tính toán.</returns>
    [HttpPost("preview")]
    public async Task<IActionResult> Preview([FromBody] CalculationRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _baoGiaService.PreviewAsync(request, ct);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
