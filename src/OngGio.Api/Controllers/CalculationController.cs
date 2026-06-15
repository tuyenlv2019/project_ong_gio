using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OngGio.Application.Calculation;
using OngGio.Application.Services;
using OngGio.Infrastructure.Persistence;

namespace OngGio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CalculationController : ControllerBase
{
    private readonly IBaoGiaService _baoGiaService;

    public CalculationController(IBaoGiaService baoGiaService)
    {
        _baoGiaService = baoGiaService;
    }

    [HttpPost("preview")]
    public async Task<IActionResult> Preview([FromBody] CalculationRequest request, CancellationToken ct)
    {
        var result = await _baoGiaService.PreviewAsync(request, ct);
        return Ok(result);
    }
}
