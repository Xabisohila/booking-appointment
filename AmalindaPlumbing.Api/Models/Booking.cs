namespace AmalindaPlumbing.Api.Models;

public class Booking
{
    public int Id { get; set; }
    public int LeadId { get; set; }
    public Lead Lead { get; set; } = null!;
    public DateTime ScheduledAt { get; set; }
    public string? Notes { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Job? Job { get; set; }
}

public enum BookingStatus
{
    Confirmed,
    Reminded,
    Completed,
    Cancelled,
    NoShow
}
