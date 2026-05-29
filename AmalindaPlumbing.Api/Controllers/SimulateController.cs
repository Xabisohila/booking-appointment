using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmalindaPlumbing.Api.Controllers;

public record SimulateMessage(string Role, string Text);

[Authorize]
[ApiController]
[Route("api/simulate")]
public class SimulateController(AnthropicClient claude, IConfiguration config) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] List<SimulateMessage> messages)
    {
        var practiceName = config["Practice:Name"] ?? "our dental practice";

        var systemPrompt = $$"""
            You are the friendly AI receptionist for {{practiceName}}. Your role is to help patients book appointments via WhatsApp.

            Your conversation flow:
            1. Greet the patient warmly and mention {{practiceName}}
            2. Ask for their name
            3. Find out their reason for visiting — toothache, routine check-up, cleaning, whitening, sensitivity, chipped or broken tooth, extraction, implants, braces/Invisalign, or something else
            4. Ask if they are a new patient or a returning patient
            5. Check urgency — are they in pain right now? Dental emergencies get priority slots
            6. Offer available appointment times and confirm their preference

            Keep every message short — this is WhatsApp, not email. One or two sentences per reply maximum.

            Once you have name, reason for visit, patient type, and preferred appointment time, respond with EXACTLY this line and nothing else:
            BOOKING_READY|{name}|{concern}|{NewPatient or ReturningPatient}|{preferredTime}

            For dental emergencies, tell them you will prioritise them and book them in urgently.
            Do not discuss pricing or treatment details — simply book the appointment.
            """;

        var history = messages
            .Select(m => new Message
            {
                Role = m.Role == "user" ? RoleType.User : RoleType.Assistant,
                Content = [new TextContent { Text = m.Text }]
            })
            .ToList();

        var request = new MessageParameters
        {
            Model = "claude-sonnet-4-6",
            MaxTokens = 500,
            System = [new SystemMessage(systemPrompt)],
            Messages = history
        };

        var response = await claude.Messages.GetClaudeMessageAsync(request);
        var reply = response.Content.OfType<TextContent>().First().Text;

        var isBookingReady = reply.StartsWith("BOOKING_READY|");
        return Ok(new { reply, isBookingReady });
    }
}
