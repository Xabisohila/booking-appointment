using System.Net;
using System.Net.Mail;

namespace AmalindaPlumbing.Api.Services;

public class EmailService(IConfiguration config, ILogger<EmailService> logger)
{
    public async Task SendNewLeadAlertAsync(string patientPhone, string concern)
    {
        var host = config["Email:SmtpHost"];
        if (string.IsNullOrEmpty(host)) return; // email not configured — skip silently

        try
        {
            var port     = int.Parse(config["Email:SmtpPort"] ?? "587");
            var username = config["Email:Username"]!;
            var password = config["Email:Password"]!;
            var alertTo  = config["Email:AlertTo"]!;
            var practice = config["Practice:Name"] ?? "Dental Practice";

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            var subject = $"New patient lead — {practice}";
            var body    = $"A new patient just messaged on WhatsApp.\n\n" +
                          $"Phone:   {patientPhone}\n" +
                          $"Concern: {concern ?? "Not yet captured"}\n\n" +
                          $"Log in to your dashboard to follow up.";

            await client.SendMailAsync(username, alertTo, subject, body);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send new lead email alert");
        }
    }
}
