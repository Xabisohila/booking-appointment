using AmalindaPlumbing.Api.Data;
using AmalindaPlumbing.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AmalindaPlumbing.Api.Services;

public class ReminderService(IServiceScopeFactory scopeFactory, ILogger<ReminderService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await SendDueRemindersAsync();
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task SendDueRemindersAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var whatsApp = scope.ServiceProvider.GetRequiredService<WhatsAppService>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        var now = DateTime.UtcNow;
        var windowStart = now.AddHours(23);
        var windowEnd = now.AddHours(25);

        var due = await db.Bookings
            .Include(b => b.Lead)
            .Where(b =>
                b.Status == BookingStatus.Confirmed &&
                b.ScheduledAt >= windowStart &&
                b.ScheduledAt <= windowEnd)
            .ToListAsync();

        foreach (var booking in due)
        {
            try
            {
                var practiceName = config["Practice:Name"] ?? "us";
                var msg = $"Hi {booking.Lead.Name}, just a friendly reminder that your appointment at {practiceName} is tomorrow, {booking.ScheduledAt:dddd dd MMMM} at {booking.ScheduledAt:HH:mm}. Reply STOP to cancel or RESCHEDULE to change your time.";
                await whatsApp.SendTextMessageAsync(booking.Lead.Phone, msg);

                booking.Status = BookingStatus.Reminded;
                logger.LogInformation("Reminder sent to {Name} ({Phone}) for {Time}", booking.Lead.Name, booking.Lead.Phone, booking.ScheduledAt);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send reminder for booking {Id}", booking.Id);
            }
        }

        if (due.Count > 0)
            await db.SaveChangesAsync();
    }
}
