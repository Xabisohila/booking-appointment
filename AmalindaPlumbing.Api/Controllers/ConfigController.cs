using Microsoft.AspNetCore.Mvc;

namespace AmalindaPlumbing.Api.Controllers;

[ApiController]
[Route("api/config")]
public class ConfigController(IConfiguration config) : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new
    {
        practiceName = config["Practice:Name"] ?? "Dental Practice"
    });
}
