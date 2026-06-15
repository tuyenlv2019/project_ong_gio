using Microsoft.AspNetCore.Mvc;

namespace OngGio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok", service = "OngGio.Api" });
}
