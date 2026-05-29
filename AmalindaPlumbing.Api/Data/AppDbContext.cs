using AmalindaPlumbing.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AmalindaPlumbing.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Job> Jobs => Set<Job>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Lead>()
            .HasOne(l => l.Booking)
            .WithOne(b => b.Lead)
            .HasForeignKey<Booking>(b => b.LeadId);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Job)
            .WithOne(j => j.Booking)
            .HasForeignKey<Job>(j => j.BookingId);

        modelBuilder.Entity<Lead>()
            .HasMany(l => l.Conversations)
            .WithOne(c => c.Lead)
            .HasForeignKey(c => c.LeadId);

        modelBuilder.Entity<Lead>()
            .Property(l => l.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Booking>()
            .Property(b => b.Status)
            .HasConversion<string>();
    }
}
