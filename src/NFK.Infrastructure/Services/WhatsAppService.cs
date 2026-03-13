using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace NFK.Infrastructure.Services;

/// <summary>
/// Service for communicating with the WhatsApp Business Cloud API.
/// Configuration is read from the "WhatsApp" section of appsettings.json or environment variables.
/// </summary>
public class WhatsAppService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WhatsAppService> _logger;
    private readonly string _accessToken;
    private readonly string _phoneNumberId;
    private readonly string _verifyToken;
    private readonly string _apiVersion;

    public WhatsAppService(HttpClient httpClient, IConfiguration configuration, ILogger<WhatsAppService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _accessToken = Environment.GetEnvironmentVariable("WHATSAPP_ACCESS_TOKEN")
            ?? configuration["WhatsApp:AccessToken"] ?? string.Empty;
        _phoneNumberId = Environment.GetEnvironmentVariable("WHATSAPP_PHONE_NUMBER_ID")
            ?? configuration["WhatsApp:PhoneNumberId"] ?? string.Empty;
        _verifyToken = Environment.GetEnvironmentVariable("WHATSAPP_VERIFY_TOKEN")
            ?? configuration["WhatsApp:VerifyToken"] ?? "nfk-whatsapp-verify-token";
        _apiVersion = configuration["WhatsApp:ApiVersion"] ?? "v21.0";
    }

    public string VerifyToken => _verifyToken;

    /// <summary>
    /// Send a text message via WhatsApp Cloud API.
    /// </summary>
    public async Task<bool> SendTextMessageAsync(string toPhoneNumber, string messageText)
    {
        if (string.IsNullOrEmpty(_accessToken) || string.IsNullOrEmpty(_phoneNumberId))
        {
            _logger.LogWarning("WhatsApp API not configured. Skipping message send to {PhoneNumber}.", toPhoneNumber);
            return false;
        }

        var url = $"https://graph.facebook.com/{_apiVersion}/{_phoneNumberId}/messages";

        var payload = new
        {
            messaging_product = "whatsapp",
            recipient_type = "individual",
            to = toPhoneNumber,
            type = "text",
            text = new { preview_url = false, body = messageText }
        };

        var json = JsonSerializer.Serialize(payload);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);

        try
        {
            var response = await _httpClient.PostAsync(url, content);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("WhatsApp API error: {StatusCode} – {Body}", response.StatusCode, error);
            }
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending WhatsApp message to {PhoneNumber}", toPhoneNumber);
            return false;
        }
    }

    /// <summary>
    /// Download a media file from the WhatsApp Media API.
    /// Returns the raw bytes, or null if unavailable.
    /// </summary>
    public async Task<(byte[]? Data, string? ContentType)> DownloadMediaAsync(string mediaId)
    {
        if (string.IsNullOrEmpty(_accessToken))
        {
            _logger.LogWarning("WhatsApp API not configured. Cannot download media {MediaId}.", mediaId);
            return (null, null);
        }

        // Step 1: retrieve the download URL from the media endpoint
        var metaUrl = $"https://graph.facebook.com/{_apiVersion}/{mediaId}";
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);

        try
        {
            var metaResponse = await _httpClient.GetAsync(metaUrl);
            if (!metaResponse.IsSuccessStatusCode)
            {
                _logger.LogError("WhatsApp media metadata fetch failed for {MediaId}: {Status}", mediaId, metaResponse.StatusCode);
                return (null, null);
            }

            var metaJson = await metaResponse.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(metaJson);
            var downloadUrl = doc.RootElement.GetProperty("url").GetString();
            if (string.IsNullOrEmpty(downloadUrl))
            {
                _logger.LogError("WhatsApp media URL missing for {MediaId}", mediaId);
                return (null, null);
            }

            // Step 2: download the actual file
            var fileResponse = await _httpClient.GetAsync(downloadUrl);
            if (!fileResponse.IsSuccessStatusCode)
            {
                _logger.LogError("WhatsApp media download failed for {MediaId}: {Status}", mediaId, fileResponse.StatusCode);
                return (null, null);
            }

            var bytes = await fileResponse.Content.ReadAsByteArrayAsync();
            var contentType = fileResponse.Content.Headers.ContentType?.MediaType;
            return (bytes, contentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading WhatsApp media {MediaId}", mediaId);
            return (null, null);
        }
    }
}
