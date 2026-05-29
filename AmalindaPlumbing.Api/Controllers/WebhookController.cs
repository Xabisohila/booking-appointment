using AmalindaPlumbing.Api.Data;
using AmalindaPlumbing.Api.Models;
using AmalindaPlumbing.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AmalindaPlumbing.Api.Controllers;

[ApiController]
[Route("api/webhook")]
public class WebhookController(AiQualificationService aiService, WhatsAppService whatsApp, AppDbContext db, IConfiguration config) : ControllerBase
{
    [HttpGet]
    public IActionResult Verify([FromQuery(Name = "hub.mode")] string mode,
                                [FromQuery(Name = "hub.verify_token")] string token,
                                [FromQuery(Name = "hub.challenge")] string challenge)
    {
        var verifyToken = config["WhatsApp:VerifyToken"];
        if (mode == "subscribe" && token == verifyToken)
            return Ok(challenge);

        return Forbid();
    }

    [HttpPost]
    public async Task<IActionResult> Receive([FromBody] JsonElement payload)
    {
        try
        {
            var entry = payload.GetProperty("entry")[0];
            var changes = entry.GetProperty("changes")[0];
            var value = changes.GetProperty("value");

            if (!value.TryGetProperty("messages", out var messages))
                return Ok();

            var message = messages[0];
            var phone = message.GetProperty("from").GetString()!;
            var text = message.GetProperty("text").GetProperty("body").GetString()!.Trim();

            var keyword = text.ToUpperInvariant();

            if (keyword == "STOP")
            {
                await HandleStopAsync(phone);
                return Ok();
            }

            if (keyword == "RESCHEDULE")
            {
                await HandleRescheduleAsync(phone);
                return Ok();
            }

            await aiService.HandleIncomingMessageAsync(phone, text);
        }
        catch
        {
            // Always return 200 to Meta to prevent retries
        }

        return Ok();
    }

    private async Task HandleStopAsync(string phone)
    {
        var booking = await db.Bookings
            .Include(b => b.Lead)
            .Where(b => b.Lead.Phone == phone && (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Reminded))
            .OrderByDescending(b => b.ScheduledAt)
            .FirstOrDefaultAsync();

        if (booking is not null)
        {
            booking.Status = BookingStatus.Cancelled;
            booking.Lead.Status = LeadStatus.Lost;
            await db.SaveChangesAsync();

            var msg = $"Your appointment on {booking.ScheduledAt:dddd dd MMMM} at {booking.ScheduledAt:HH:mm} has been cancelled. We hope to see you again soon!";
            await whatsApp.SendTextMessageAsync(phone, msg);
        }
        else
        {
            await whatsApp.SendTextMessageAsync(phone, "You have no upcoming appointments to cancel. Feel free to message us anytime to book.");
        }
    }

    private async Task HandleRescheduleAsync(string phone)
    {
        var booking = await db.Bookings
            .Include(b => b.Lead)
            .Where(b => b.Lead.Phone == phone && (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Reminded))
            .OrderByDescending(b => b.ScheduledAt)
            .FirstOrDefaultAsync();

        if (booking is not null)
        {
            var practiceName = config["Practice:Name"] ?? "us";
            var msg = $"No problem! To reschedule your appointment at {practiceName}, please call us or reply with your preferred new date and time and we will sort it out for you.";
            await whatsApp.SendTextMessageAsync(phone, msg);
        }
        else
        {
            await whatsApp.SendTextMessageAsync(phone, "You have no upcoming appointments to reschedule. Feel free to message us anytime to book a new one.");
        }
    }
}
