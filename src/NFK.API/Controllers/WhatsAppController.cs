using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NFK.Application.DTOs.WhatsApp;
using NFK.Domain.Entities.Documents;
using NFK.Domain.Enums;
using NFK.Infrastructure.Data;
using NFK.Infrastructure.Security;
using NFK.Infrastructure.Services;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/whatsapp")]
public class WhatsAppController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly WhatsAppService _whatsApp;
    private readonly EncryptionService _encryption;
    private readonly ILogger<WhatsAppController> _logger;
    private readonly IConfiguration _configuration;

    public WhatsAppController(
        ApplicationDbContext context,
        WhatsAppService whatsApp,
        EncryptionService encryption,
        ILogger<WhatsAppController> logger,
        IConfiguration configuration)
    {
        _context = context;
        _whatsApp = whatsApp;
        _encryption = encryption;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Webhook verification endpoint required by Meta during setup.
    /// GET /api/v1/whatsapp/webhook
    /// </summary>
    [HttpGet("webhook")]
    [AllowAnonymous]
    public IActionResult VerifyWebhook(
        [FromQuery(Name = "hub.mode")] string mode,
        [FromQuery(Name = "hub.verify_token")] string token,
        [FromQuery(Name = "hub.challenge")] string challenge)
    {
        if (mode == "subscribe" && token == _whatsApp.VerifyToken)
        {
            _logger.LogInformation("WhatsApp webhook verified successfully");
            return Ok(challenge);
        }

        _logger.LogWarning("WhatsApp webhook verification failed – mode={Mode} token={Token}", mode, token);
        return Forbid();
    }

    /// <summary>
    /// Receive incoming WhatsApp messages from Meta webhook.
    /// POST /api/v1/whatsapp/webhook
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> ReceiveMessage([FromBody] WhatsAppWebhookPayload payload)
    {
        try
        {
            if (payload?.Object != "whatsapp_business_account")
                return Ok(); // not our concern

            foreach (var entry in payload.Entry ?? [])
            {
                foreach (var change in entry.Changes ?? [])
                {
                    var messages = change.Value?.Messages;
                    if (messages == null) continue;

                    foreach (var msg in messages)
                    {
                        await ProcessIncomingMessageAsync(msg);
                    }
                }
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing WhatsApp webhook payload");
            // Always return 200 to Meta to avoid retries
            return Ok();
        }
    }

    /// <summary>
    /// Send a WhatsApp message to a user (staff-initiated).
    /// POST /api/v1/whatsapp/send
    /// </summary>
    [HttpPost("send")]
    [Authorize]
    public async Task<IActionResult> SendWhatsAppMessage([FromBody] SendWhatsAppRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(new { error = "unauthorized", message = "User not found" });

            var recipient = await _context.Users.FindAsync(request.RecipientUserId);
            if (recipient == null || !recipient.IsActive)
                return BadRequest(new { error = "invalid_recipient", message = "Recipient user not found or inactive" });

            var phoneNumber = recipient.PhoneNumber;
            if (string.IsNullOrWhiteSpace(phoneNumber))
                return BadRequest(new { error = "no_phone", message = "Recipient has no phone number on file" });

            // Normalize phone number (strip spaces/dashes)
            phoneNumber = NormalizePhone(phoneNumber);

            var sent = await _whatsApp.SendTextMessageAsync(phoneNumber, request.Content);

            // Record internal message regardless of API outcome (graceful degradation)
            var message = new Domain.Entities.Messaging.Message
            {
                SenderUserId = currentUserId.Value,
                RecipientUserId = request.RecipientUserId,
                Subject = _encryption.Encrypt("WhatsApp") ?? "WhatsApp",
                Content = _encryption.Encrypt(request.Content) ?? request.Content,
                IsRead = false,
                IsPoolEmail = false,
                AssistantVisible = false,
                IsWhatsApp = true
            };
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, delivered = sent, messageId = message.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending WhatsApp message");
            return StatusCode(500, new { error = "internal_error", message = "Error sending WhatsApp message" });
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private async Task ProcessIncomingMessageAsync(WhatsAppMessage msg)
    {
        // Deduplicate: skip if we already stored this wamid
        var existing = _context.Messages.Any(m => m.WhatsAppMessageId == msg.Id);
        if (existing) return;

        // Try to match sender phone number to a user
        var normalized = NormalizePhone(msg.From);
        var matchedUser = _context.Users
            .FirstOrDefault(u => u.PhoneNumber != null && u.PhoneNumber.Replace(" ", "").Replace("-", "").Replace("+", "") == normalized);

        // Determine text content
        var textContent = msg.Type switch
        {
            "text" => msg.Text?.Body ?? string.Empty,
            "image" => msg.Image?.Caption ?? "[Bild]",
            "document" => msg.Document?.Caption ?? msg.Document?.Filename ?? "[Dokument]",
            "audio" => "[Sprachnachricht]",
            "video" => msg.Video?.Caption ?? "[Video]",
            _ => $"[{msg.Type}]"
        };

        // Get a staff recipient for unmatched senders or use the matched user for their own conversation
        // For inbound messages we use the first SuperAdmin / Consultant as recipient
        var staffRecipient = await GetDefaultStaffRecipientAsync();
        if (staffRecipient == null)
        {
            _logger.LogWarning("No staff recipient found for incoming WhatsApp message from {From}", msg.From);
            return;
        }

        var encryptedContent = _encryption.Encrypt(textContent) ?? textContent;
        var encryptedSubject = _encryption.Encrypt("WhatsApp") ?? "WhatsApp";

        var message = new Domain.Entities.Messaging.Message
        {
            SenderUserId = matchedUser?.Id,
            RecipientUserId = staffRecipient.Id,
            Subject = encryptedSubject,
            Content = encryptedContent,
            IsRead = false,
            IsPoolEmail = false,
            AssistantVisible = false,
            IsWhatsApp = true,
            WhatsAppMessageId = msg.Id
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Stored incoming WhatsApp message {WamId} from {From} (userId={UserId})",
            msg.Id, msg.From, matchedUser?.Id.ToString() ?? "unknown");

        // Download and save media attachments
        var mediaInfo = msg.Type switch
        {
            "image" => msg.Image,
            "document" => msg.Document,
            _ => null
        };

        if (mediaInfo != null && matchedUser != null)
        {
            await SaveWhatsAppMediaAsync(mediaInfo, matchedUser.Id, msg.Type);
        }
    }

    private async Task SaveWhatsAppMediaAsync(WhatsAppMedia media, int userId, string mediaType)
    {
        try
        {
            var (bytes, contentType) = await _whatsApp.DownloadMediaAsync(media.Id);
            if (bytes == null) return;

            var ext = GetExtension(contentType ?? media.MimeType);
            var filename = media.Filename ?? $"whatsapp_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}";
            var safeFilename = $"{Guid.NewGuid()}_{filename}";

            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "whatsapp", userId.ToString());
            Directory.CreateDirectory(uploadsPath);
            var filePath = Path.Combine(uploadsPath, safeFilename);
            await System.IO.File.WriteAllBytesAsync(filePath, bytes);

            // Find the user's active case if any
            var activeCase = _context.Cases
                .Where(c => c.Client != null && c.Client.UserId == userId)
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefault();

            var document = new Document
            {
                FileName = filename,
                FilePath = Path.Combine("uploads", "whatsapp", userId.ToString(), safeFilename),
                FileType = contentType ?? media.MimeType,
                FileSize = bytes.Length,
                Status = DocumentStatus.Pending,
                UploadedByUserId = userId,
                CaseId = activeCase?.Id,
                Description = $"WhatsApp-Anhang ({mediaType})"
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Saved WhatsApp media {MediaId} as document for user {UserId}, file={File}",
                media.Id, userId, safeFilename);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save WhatsApp media {MediaId}", media.Id);
        }
    }

    private async Task<Domain.Entities.Users.User?> GetDefaultStaffRecipientAsync()
    {
        var staffRoles = new[] { "SuperAdmin", "Consultant" };
        return await System.Threading.Tasks.Task.FromResult(
            _context.UserRoles
                .Where(ur => staffRoles.Contains(ur.Role.Name))
                .OrderBy(ur => ur.UserId)
                .Select(ur => ur.User)
                .FirstOrDefault(u => u != null && u.IsActive));
    }

    private static string NormalizePhone(string phone) =>
        phone.Replace(" ", "").Replace("-", "").Replace("+", "").TrimStart('0');

    private static string GetExtension(string mimeType) => mimeType switch
    {
        "image/jpeg" => ".jpg",
        "image/png" => ".png",
        "image/gif" => ".gif",
        "image/webp" => ".webp",
        "application/pdf" => ".pdf",
        "application/msword" => ".doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => ".docx",
        "audio/ogg" => ".ogg",
        "audio/mpeg" => ".mp3",
        "video/mp4" => ".mp4",
        _ => ".bin"
    };

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst("sub") ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (claim != null && int.TryParse(claim.Value, out var id))
            return id;
        return null;
    }
}
