using AmalindaPlumbing.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmalindaPlumbing.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/slots")]
public class SlotsController(SlotService slots) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int days = 7)
    {
        var available = await slots.GetAvailableSlotsAsync(days);
        return Ok(available.Select(s => new
        {
            dateTime = s,
            display  = s.ToString("dddd d MMM 'at' HH:mm")
        }));
    }
}
