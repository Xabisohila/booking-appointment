namespace AmalindaPlumbing.Api.Models;

public class Job
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public DateTime CompletedAt { get; set; }
    public string? DentistNotes { get; set; }
    public bool ReviewRequested { get; set; } = false;
    public DateTime? ReviewRequestedAt { get; set; }
    public int? ReviewRating { get; set; }
    public string? ReviewText { get; set; }
}
