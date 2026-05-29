using System.Text;
using System.Text.Json;

namespace AmalindaPlumbing.Api.Services;

public class WhatsAppService(IConfiguration config, IHttpClientFactory httpClientFactory)
{
    private readonly string _phoneNumberId = config["WhatsApp:PhoneNumberId"]!;
    private readonly string _accessToken = config["WhatsApp:AccessToken"]!;
    private const string BaseUrl = "https://graph.facebook.com/v19.0";

    public async Task SendTextMessageAsync(string to, string message)
    {
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_accessToken}");

        var payload = new
        {
            messaging_product = "whatsapp",
            to,
            type = "text",
            text = new { body = message }
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        await client.PostAsync($"{BaseUrl}/{_phoneNumberId}/messages", content);
    }
}
