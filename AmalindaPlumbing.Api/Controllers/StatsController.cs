using AmalindaPlumbing.Api.Data;
using AmalindaPlumbing.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AmalindaPlumbing.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/stats")]
public class StatsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var todayEnd = todayStart.AddDays(1);

        var leads = await db.Leads.ToListAsync();
        var bookings = await db.Bookings
            .Include(b => b.Lead)
            .Include(b => b.Job)
            .OrderByDescending(b => b.ScheduledAt)
            .ToListAsync();

        var todayBookings = bookings
            .Where(b => b.ScheduledAt >= todayStart && b.ScheduledAt < todayEnd)
            .OrderBy(b => b.ScheduledAt)
            .Select(b => new
            {
                b.Id,
                patientName = b.Lead.Name,
                concern = b.Lead.Concern,
                time = b.ScheduledAt.ToString("HH:mm"),
                b.Status
            });

        var recentLeads = leads
            .OrderByDescending(l => l.CreatedAt)
            .Take(5)
            .Select(l => new
            {
                l.Id,
                l.Name,
                l.Concern,
                l.Status,
                l.CreatedAt
            });

        return Ok(new
        {
            totalLeads      = leads.Count,
            qualifying      = leads.Count(l => l.Status == LeadStatus.Qualifying),
            qualified       = leads.Count(l => l.Status == LeadStatus.Qualified),
            booked          = leads.Count(l => l.Status == LeadStatus.Booked),
            lost            = leads.Count(l => l.Status == LeadStatus.Lost),
            completedToday  = bookings.Count(b => b.Status == BookingStatus.Completed && b.ScheduledAt >= todayStart && b.ScheduledAt < todayEnd),
            noShowsTotal    = bookings.Count(b => b.Status == BookingStatus.NoShow),
            reviewsSent     = bookings.Count(b => b.Job != null && b.Job.ReviewRequested),
            todayBookings,
            recentLeads
        });
    }
}
