using AmalindaPlumbing.Api.Data;
using AmalindaPlumbing.Api.Models;
using AmalindaPlumbing.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AmalindaPlumbing.Api.Controllers;

public record CreateBookingRequest(int LeadId, DateTime ScheduledAt, string? Notes);
public record LogReviewRequest(int Rating, string? Text);

[Authorize]
[ApiController]
[Route("api/bookings")]
public class BookingsController(AppDbContext db, WhatsAppService whatsApp, IConfiguration config) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest req)
    {
        var lead = await db.Leads.FindAsync(req.LeadId);
        if (lead is null) return NotFound();
        if (await db.Bookings.AnyAsync(b => b.LeadId == req.LeadId))
            return BadRequest(new { message = "Lead already has a booking" });

        var booking = new Booking
        {
            LeadId = req.LeadId,
            ScheduledAt = req.ScheduledAt,
            Notes = req.Notes,
            Status = BookingStatus.Confirmed
        };
        db.Bookings.Add(booking);
        lead.Status = LeadStatus.Booked;
        await db.SaveChangesAsync();
        return Ok(booking);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var bookings = await db.Bookings
            .Include(b => b.Lead)
            .Include(b => b.Job)
            .OrderByDescending(b => b.ScheduledAt)
            .ToListAsync();
        return Ok(bookings);
    }

    [HttpPost("{id}/complete")]
    public async Task<IActionResult> MarkComplete(int id, [FromBody] string? dentistNotes)
    {
        var booking = await db.Bookings
            .Include(b => b.Lead)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null) return NotFound();

        booking.Status = BookingStatus.Completed;

        var job = new Job
        {
            BookingId = booking.Id,
            CompletedAt = DateTime.UtcNow,
            DentistNotes = dentistNotes,
            ReviewRequested = true,
            ReviewRequestedAt = DateTime.UtcNow
        };
        db.Jobs.Add(job);
        await db.SaveChangesAsync();

        var practiceName = config["Practice:Name"] ?? "us";
        var reviewLink = config["Practice:GoogleReviewLink"] ?? "";
        var reviewMsg = $"Hi {booking.Lead.Name}! Thank you for visiting {practiceName} today. We hope your appointment went well. Could you spare 30 seconds to leave us a Google review? It really helps other patients find us: {reviewLink} Thank you! 😊";
        await whatsApp.SendTextMessageAsync(booking.Lead.Phone, reviewMsg);

        return Ok(job);
    }

    [HttpPatch("{id}/review")]
    public async Task<IActionResult> LogReview(int id, [FromBody] LogReviewRequest req)
    {
        var job = await db.Jobs.FirstOrDefaultAsync(j => j.BookingId == id);
        if (job is null) return NotFound();
        job.ReviewRating = req.Rating;
        job.ReviewText = req.Text;
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpPatch("{id}/notes")]
    public async Task<IActionResult> UpdateNotes(int id, [FromBody] string notes)
    {
        var job = await db.Jobs.FirstOrDefaultAsync(j => j.BookingId == id);
        if (job is null) return NotFound();
        job.DentistNotes = notes;
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/noshow")]
    public async Task<IActionResult> MarkNoShow(int id)
    {
        var booking = await db.Bookings
            .Include(b => b.Lead)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null) return NotFound();

        booking.Status = BookingStatus.NoShow;
        await db.SaveChangesAsync();

        return Ok();
    }

    [HttpPost("{id}/remind")]
    public async Task<IActionResult> SendReminder(int id)
    {
        var booking = await db.Bookings
            .Include(b => b.Lead)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null) return NotFound();

        var practiceName = config["Practice:Name"] ?? "us";
        var msg = $"Hi {booking.Lead.Name}, just a friendly reminder that your appointment at {practiceName} is on {booking.ScheduledAt:dddd, dd MMMM} at {booking.ScheduledAt:HH:mm}. Please reply STOP to cancel or RESCHEDULE to change your time.";
        await whatsApp.SendTextMessageAsync(booking.Lead.Phone, msg);

        booking.Status = BookingStatus.Reminded;
        await db.SaveChangesAsync();

        return Ok();
    }
}
