using AmalindaPlumbing.Api.Data;
using AmalindaPlumbing.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AmalindaPlumbing.Api.Services;

public class SlotService(AppDbContext db, IConfiguration config)
{
    public async Task<List<DateTime>> GetAvailableSlotsAsync(int daysAhead = 7)
    {
        var days      = (config["WorkingHours:Days"] ?? "Monday,Tuesday,Wednesday,Thursday,Friday")
                        .Split(',', StringSplitOptions.TrimEntries)
                        .Select(d => Enum.Parse<DayOfWeek>(d))
                        .ToHashSet();
        var startTime = TimeSpan.Parse(config["WorkingHours:Start"] ?? "08:00");
        var endTime   = TimeSpan.Parse(config["WorkingHours:End"]   ?? "17:00");
        var slotMins  = int.Parse(config["WorkingHours:SlotMinutes"] ?? "30");

        var bookedTimes = await db.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Reminded)
            .Select(b => b.ScheduledAt)
            .ToListAsync();

        var slots = new List<DateTime>();
        var now   = DateTime.UtcNow;

        for (var d = 1; d <= daysAhead; d++)
        {
            var day = now.Date.AddDays(d);
            if (!days.Contains(day.DayOfWeek)) continue;

            for (var t = startTime; t < endTime; t = t.Add(TimeSpan.FromMinutes(slotMins)))
            {
                var slot = day + t;
                if (!bookedTimes.Any(b => Math.Abs((b - slot).TotalMinutes) < slotMins))
                    slots.Add(slot);
            }
        }

        return slots;
    }

    public async Task<string> GetAvailableSlotsTextAsync(int daysAhead = 7)
    {
        var slots = await GetAvailableSlotsAsync(daysAhead);
        if (slots.Count == 0) return "no available slots in the next week";

        return string.Join(", ", slots
            .Take(8)
            .Select(s => s.ToString("dddd d MMM 'at' HH:mm")));
    }
}
