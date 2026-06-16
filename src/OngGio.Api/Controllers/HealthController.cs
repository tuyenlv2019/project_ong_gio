using Microsoft.AspNetCore.Mvc;

namespace OngGio.Api.Controllers;

/// <summary>
/// Endpoint kiểm tra trạng thái sống của service.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    /// <summary>
    /// Trả về trạng thái health đơn giản cho hệ thống giám sát.
    /// </summary>
    /// <returns>JSON chứa trạng thái service.</returns>
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok", service = "OngGio.Api" });
}
