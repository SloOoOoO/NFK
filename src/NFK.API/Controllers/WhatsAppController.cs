using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.WhatsApp;
using NFK.Infrastructure.Data;
using NFK.Infrastructure.Security;
using NFK.Infrastructure.Services;
using System.Text.Json;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/whatsapp")]
public class WhatsAppController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly WhatsAppService _whatsAppService;
    private readonly EncryptionService _encryption;
    private readonly ILogger<WhatsAppController> _logger;
    private readonly IConfiguration _configuration;

    public WhatsAppController(
        ApplicationDbContext context,
        WhatsAppService whatsAppService,
        EncryptionService encryption,
        ILogger<WhatsAppController> logger,
        IConfiguration configuration)
    {
        _context = context;
        _whatsAppService = whatsAppService;
        _encryption = encryption;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Meta webhook verification endpoint.
    /// </summary>
    [HttpGet("webhook")]
    [AllowAnonymous]
    public IActionResult VerifyWebhook(
        [FromQuery(Name = "hub.mode")] string? hubMode,
        [FromQuery(Name = "hub.verify_token")] string? hubVerifyToken,
        [FromQuery(Name = "hub.challenge")] string? hubChallenge)
    {
        var configuredToken = _configuration["WhatsApp:VerifyToken"] ?? "nfk-whatsapp-verify-token";

        if (hubMode == "subscribe" && hubVerifyToken == configuredToken)
        {
            _logger.LogInformation("WhatsApp webhook verified successfully.");
            return Content(hubChallenge ?? "", "text/plain");
        }

        _logger.LogWarning("WhatsApp webhook verification failed. Mode: {Mode}, Token matches: {TokenMatch}",
            hubMode, hubVerifyToken == configuredToken);
        return Forbid();
    }

    /// <summary>
    /// Receive incoming WhatsApp messages from Meta.
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> ReceiveWebhook([FromBody] WhatsAppWebhookPayload? payload)
    {
        // Always return 200 OK to Meta to prevent retries
        try
        {
            if (payload == null || payload.Object != "whatsapp_business_account")
            {
                return Ok();
            }

            foreach (var entry in payload.Entry)
            {
                foreach (var change in entry.Changes)
                {
                    if (change.Field != "messages" || change.Value.Messages == null)
                        continue;

                    foreach (var msg in change.Value.Messages)
                    {
                        await ProcessIncomingMessage(msg, change.Value);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing WhatsApp webhook payload");
        }

        return Ok();
    }

    /// <summary>
    /// Send a WhatsApp message to a user.
    /// </summary>
    [HttpPost("send")]
    [Authorize]
    public async Task<IActionResult> SendMessage([FromBody] SendWhatsAppRequest request)
    {
        try
        {
            var currentUserIdStr = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(currentUserIdStr, out var currentUserId))
            {
                return Unauthorized(new { error = "unauthorized" });
            }

            var recipient = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == request.RecipientUserId && u.IsActive);

            if (recipient == null)
            {
                return BadRequest(new { error = "invalid_recipient", message = "Recipient not found or inactive" });
            }

            if (string.IsNullOrWhiteSpace(recipient.PhoneNumber))
            {
                return BadRequest(new { error = "no_phone", message = "Recipient has no phone number configured" });
            }

            var normalizedPhone = WhatsAppService.NormalizePhone(recipient.PhoneNumber);
            var sent = await _whatsAppService.SendTextMessage(normalizedPhone, request.Content);

            if (!sent)
            {
                return StatusCode(502, new { error = "whatsapp_error", message = "Failed to send WhatsApp message" });
            }

            // Create internal message record
            var message = new Domain.Entities.Messaging.Message
            {
                SenderUserId = currentUserId,
                RecipientUserId = request.RecipientUserId,
                Subject = _encryption.Encrypt("WhatsApp Nachricht") ?? "WhatsApp Nachricht",
                Content = _encryption.Encrypt(request.Content) ?? request.Content,
                IsRead = false,
                IsPoolEmail = false,
                IsWhatsApp = true
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, messageId = message.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending WhatsApp message");
            return StatusCode(500, new { error = "internal_error" });
        }
    }

    private async Task ProcessIncomingMessage(WhatsAppMessage msg, WhatsAppValue value)
    {
        try
        {
            var fromPhone = msg.From;

            // Look up user by phone number
            var allUsers = await _context.Users
                .Where(u => u.IsActive && u.PhoneNumber != null && u.PhoneNumber != "")
                .ToListAsync();

            var normalizedFrom = WhatsAppService.NormalizePhone(fromPhone);
            var matchedUser = allUsers.FirstOrDefault(u =>
                WhatsAppService.NormalizePhone(u.PhoneNumber ?? "") == normalizedFrom);

            if (matchedUser == null)
            {
                _logger.LogWarning("No user found for WhatsApp phone {Phone}. Storing without SenderUserId.", fromPhone);
            }

            // Get default recipient (configurable admin/consultant)
            var defaultRecipientEmail = _configuration["WhatsApp:DefaultRecipientEmail"] ?? "karatas@nfk-buchhaltung.de";
            var defaultRecipient = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == defaultRecipientEmail && u.IsActive);

            if (defaultRecipient == null)
            {
                // Fall back to first SuperAdmin
                defaultRecipient = await _context.Users
                    .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                    .FirstOrDefaultAsync(u => u.IsActive && u.UserRoles.Any(ur => ur.Role.Name == "SuperAdmin"));
            }

            if (defaultRecipient == null)
            {
                _logger.LogError("No default recipient found for incoming WhatsApp message.");
                return;
            }

            // Extract text content
            string textContent;
            string? mediaId = null;
            string? mediaType = null;

            switch (msg.Type)
            {
                case "text":
                    textContent = msg.Text?.Body ?? "(leere Nachricht)";
                    break;
                case "image":
                    textContent = msg.Image?.Caption ?? "[Bild empfangen]";
                    mediaId = msg.Image?.Id;
                    mediaType = "image";
                    break;
                case "document":
                    textContent = msg.Document?.Caption ?? $"[Dokument: {msg.Document?.Filename ?? "Datei"}]";
                    mediaId = msg.Document?.Id;
                    mediaType = "document";
                    break;
                case "audio":
                    textContent = "[Sprachnachricht empfangen]";
                    mediaId = msg.Audio?.Id;
                    mediaType = "audio";
                    break;
                case "video":
                    textContent = msg.Video?.Caption ?? "[Video empfangen]";
                    mediaId = msg.Video?.Id;
                    mediaType = "video";
                    break;
                default:
                    textContent = $"[{msg.Type} Nachricht empfangen]";
                    break;
            }

            // Create message record
            var message = new Domain.Entities.Messaging.Message
            {
                SenderUserId = matchedUser?.Id,
                RecipientUserId = defaultRecipient.Id,
                Subject = _encryption.Encrypt("WhatsApp Nachricht") ?? "WhatsApp Nachricht",
                Content = _encryption.Encrypt(textContent) ?? textContent,
                IsRead = false,
                IsPoolEmail = false,
                IsWhatsApp = true,
                WhatsAppMessageId = msg.Id
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Download and save media attachments if present
            if (mediaId != null && matchedUser != null)
            {
                await SaveWhatsAppMedia(mediaId, mediaType ?? "file", matchedUser.Id, message.Id);
            }

            _logger.LogInformation("Stored WhatsApp message from {Phone} (userId={UserId}), msgId={MsgId}",
                fromPhone, matchedUser?.Id.ToString() ?? "unknown", msg.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing incoming WhatsApp message from {Phone}", msg.From);
        }
    }

    private async Task SaveWhatsAppMedia(string mediaId, string mediaType, int userId, int messageId)
    {
        try
        {
            var (data, mimeType, fileName) = await _whatsAppService.DownloadMedia(mediaId);
            if (data == null) return;

            var uploadPath = _configuration["Storage:LocalPath"] ?? "/uploads";
            var waDir = Path.Combine(uploadPath, "whatsapp", userId.ToString());
            Directory.CreateDirectory(waDir);

            if (string.IsNullOrEmpty(fileName))
            {
                var ext = mimeType?.Split('/').LastOrDefault() ?? "bin";
                fileName = $"whatsapp_{mediaId}.{ext}";
            }

            var filePath = Path.Combine(waDir, fileName);
            await System.IO.File.WriteAllBytesAsync(filePath, data);

            // Create Document record
            var document = new Domain.Entities.Documents.Document
            {
                FileName = fileName,
                FilePath = filePath,
                FileType = mimeType ?? "application/octet-stream",
                FileSize = data.Length,
                Status = Domain.Enums.DocumentStatus.Pending,
                UploadedByUserId = userId,
                Description = $"WhatsApp {mediaType} - message ID {messageId}"
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving WhatsApp media {MediaId}", mediaId);
        }
    }
}
