using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace NFK.Infrastructure.Services;

public class WhatsAppService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WhatsAppService> _logger;
    private readonly string _accessToken;
    private readonly string _phoneNumberId;
    private readonly string _apiVersion;

    public WhatsAppService(HttpClient httpClient, IConfiguration configuration, ILogger<WhatsAppService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _accessToken = Environment.GetEnvironmentVariable("WHATSAPP_ACCESS_TOKEN")
            ?? configuration["WhatsApp:AccessToken"] ?? "";
        _phoneNumberId = Environment.GetEnvironmentVariable("WHATSAPP_PHONE_NUMBER_ID")
            ?? configuration["WhatsApp:PhoneNumberId"] ?? "";
        _apiVersion = configuration["WhatsApp:ApiVersion"] ?? "v21.0";
    }

    public bool IsConfigured => !string.IsNullOrEmpty(_accessToken) && !string.IsNullOrEmpty(_phoneNumberId);

    public async Task<bool> SendTextMessage(string phoneNumber, string message)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("WhatsApp is not configured. Skipping send.");
            return false;
        }

        try
        {
            var url = $"https://graph.facebook.com/{_apiVersion}/{_phoneNumberId}/messages";
            var payload = new
            {
                messaging_product = "whatsapp",
                recipient_type = "individual",
                to = phoneNumber,
                type = "text",
                text = new { preview_url = false, body = message }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("WhatsApp send failed: {StatusCode} {Error}", response.StatusCode, error);
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending WhatsApp message to {PhoneNumber}", phoneNumber);
            return false;
        }
    }

    public async Task<(byte[]? Data, string? MimeType, string? FileName)> DownloadMedia(string mediaId)
    {
        if (!IsConfigured) return (null, null, null);

        try
        {
            // Step 1: Get media URL
            var metaUrl = $"https://graph.facebook.com/{_apiVersion}/{mediaId}";
            var metaRequest = new HttpRequestMessage(HttpMethod.Get, metaUrl);
            metaRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
            var metaResponse = await _httpClient.SendAsync(metaRequest);

            if (!metaResponse.IsSuccessStatusCode) return (null, null, null);

            var metaJson = await metaResponse.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(metaJson);
            var downloadUrl = doc.RootElement.GetProperty("url").GetString();
            var mimeType = doc.RootElement.TryGetProperty("mime_type", out var mt) ? mt.GetString() : null;
            var fileName = doc.RootElement.TryGetProperty("filename", out var fn) ? fn.GetString() : null;

            if (string.IsNullOrEmpty(downloadUrl)) return (null, null, null);

            // Step 2: Download the actual file
            var downloadRequest = new HttpRequestMessage(HttpMethod.Get, downloadUrl);
            downloadRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
            var downloadResponse = await _httpClient.SendAsync(downloadRequest);

            if (!downloadResponse.IsSuccessStatusCode) return (null, null, null);

            var data = await downloadResponse.Content.ReadAsByteArrayAsync();
            return (data, mimeType, fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading WhatsApp media {MediaId}", mediaId);
            return (null, null, null);
        }
    }

    /// <summary>
    /// Normalizes a phone number for lookup (removes spaces, dashes, parentheses, leading +).
    /// </summary>
    public static string NormalizePhone(string phone)
    {
        return phone
            .Replace(" ", "")
            .Replace("-", "")
            .Replace("(", "")
            .Replace(")", "")
            .TrimStart('+');
    }
}
