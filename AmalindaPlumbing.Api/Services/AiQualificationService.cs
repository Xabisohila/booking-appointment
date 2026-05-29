using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using AmalindaPlumbing.Api.Data;
using AmalindaPlumbing.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AmalindaPlumbing.Api.Services;

public class AiQualificationService(AppDbContext db, AnthropicClient claude, WhatsAppService whatsApp, EmailService email, SlotService slots, IConfiguration config)
{
    private string PracticeName => config["Practice:Name"] ?? "our dental practice";

    private async Task<string> BuildSystemPromptAsync()
    {
        var availableSlots = await slots.GetAvailableSlotsTextAsync();
        return BuildSystemPromptWithSlots(availableSlots);
    }

    private string BuildSystemPromptWithSlots(string availableSlots) => $$"""
        You are the friendly AI receptionist for {{PracticeName}}. Your role is to help patients book appointments via WhatsApp.

        Your conversation flow:
        1. Greet the patient warmly and mention {{PracticeName}}
        2. Ask for their name
        3. Find out their reason for visiting — toothache, routine check-up, cleaning, whitening, sensitivity, chipped or broken tooth, extraction, implants, braces/Invisalign, or something else
        4. Ask if they are a new patient or a returning patient
        5. Check urgency — are they in pain right now? Dental emergencies (severe pain, swelling, facial trauma) get priority slots
        6. Offer available appointment times from this list and confirm the patient's preference:
           {{availableSlots}}

        Keep every message short — this is WhatsApp, not email. One or two sentences per reply maximum.

        Once you have name, reason for visit, patient type, and preferred appointment time, respond with EXACTLY this line and nothing else:
        BOOKING_READY|{name}|{concern}|{NewPatient or ReturningPatient}|{preferredTime}

        Example: BOOKING_READY|Sarah Jones|Toothache - moderate pain|NewPatient|2025-06-05 10:00

        For dental emergencies, tell them you will prioritise them and book them in urgently.
        Do not discuss pricing or treatment details — simply book the appointment.
        """;

    public async Task HandleIncomingMessageAsync(string phone, string userMessage)
    {
        // Find the most recent active lead for this phone number.
        // If their last lead is done (Booked/Lost) start a fresh one so
        // returning patients get a clean qualification flow.
        var lead = await db.Leads
            .Include(l => l.Conversations)
            .Where(l => l.Phone == phone)
            .OrderByDescending(l => l.CreatedAt)
            .FirstOrDefaultAsync();

        var isActive = lead != null &&
                       lead.Status != LeadStatus.Lost &&
                       !(lead.Status == LeadStatus.Booked &&
                         await db.Bookings.AnyAsync(b => b.LeadId == lead.Id &&
                             (b.Status == BookingStatus.Completed ||
                              b.Status == BookingStatus.Cancelled ||
                              b.Status == BookingStatus.NoShow)));

        if (lead == null || !isActive)
        {
            lead = new Lead { Phone = phone, Status = LeadStatus.Qualifying };
            db.Leads.Add(lead);
            await db.SaveChangesAsync();
            await email.SendNewLeadAlertAsync(phone, null);
        }

        lead.Conversations.Add(new Conversation
        {
            LeadId = lead.Id,
            Role = "user",
            Message = userMessage
        });
        lead.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var history = lead.Conversations
            .OrderBy(c => c.SentAt)
            .Select(c => new Message { Role = c.Role == "user" ? RoleType.User : RoleType.Assistant, Content = [new TextContent { Text = c.Message }] })
            .ToList();

        var request = new MessageParameters
        {
            Model = "claude-sonnet-4-6",
            MaxTokens = 500,
            System = [new SystemMessage(await BuildSystemPromptAsync())],
            Messages = history
        };

        var response = await claude.Messages.GetClaudeMessageAsync(request);
        var aiReply = response.Content.OfType<TextContent>().First().Text;

        lead.Conversations.Add(new Conversation
        {
            LeadId = lead.Id,
            Role = "assistant",
            Message = aiReply
        });
        await db.SaveChangesAsync();

        if (aiReply.StartsWith("BOOKING_READY|"))
        {
            await HandleBookingReadyAsync(lead, aiReply, phone);
        }
        else
        {
            await whatsApp.SendTextMessageAsync(phone, aiReply);
        }
    }

    private async Task HandleBookingReadyAsync(Lead lead, string aiReply, string phone)
    {
        var parts = aiReply.Split('|');
        if (parts.Length >= 5)
        {
            lead.Name = parts[1];
            lead.Concern = parts[2];
            lead.Address = parts[3]; // "NewPatient" or "ReturningPatient"
            lead.Status = LeadStatus.Qualified;

            if (DateTime.TryParse(parts[4], out var scheduledAt))
            {
                var booking = new Booking
                {
                    LeadId = lead.Id,
                    ScheduledAt = scheduledAt,
                    Status = BookingStatus.Confirmed
                };
                db.Bookings.Add(booking);
                lead.Status = LeadStatus.Booked;
            }

            await db.SaveChangesAsync();
        }

        var practiceName = config["Practice:Name"] ?? "our dental practice";
        var confirmMsg = $"Great news, {lead.Name}! Your appointment at {practiceName} is confirmed. We'll send you a reminder beforehand. Reply STOP to cancel.";
        await whatsApp.SendTextMessageAsync(phone, confirmMsg);
    }
}
