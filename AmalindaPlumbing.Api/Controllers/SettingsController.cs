using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmalindaPlumbing.Api.Controllers;

public record SettingsDto(
    string PracticeName,
    string GoogleReviewLink,
    string WorkingDays,
    string WorkingStart,
    string WorkingEnd,
    int SlotMinutes
);

[Authorize]
[ApiController]
[Route("api/settings")]
public class SettingsController(IConfiguration config) : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new SettingsDto(
        PracticeName:     config["Practice:Name"]            ?? "",
        GoogleReviewLink: config["Practice:GoogleReviewLink"] ?? "",
        WorkingDays:      config["WorkingHours:Days"]         ?? "Monday,Tuesday,Wednesday,Thursday,Friday",
        WorkingStart:     config["WorkingHours:Start"]        ?? "08:00",
        WorkingEnd:       config["WorkingHours:End"]          ?? "17:00",
        SlotMinutes:      int.Parse(config["WorkingHours:SlotMinutes"] ?? "30")
    ));
}
