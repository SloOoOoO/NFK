using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.Messages;
using NFK.Infrastructure.Data;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<MessagesController> _logger;

    public MessagesController(ApplicationDbContext context, ILogger<MessagesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new { error = "unauthorized", message = "User not found" });
            }

            // Get user role from claims, default to empty if not found
            var userRole = User.FindFirst("role")?.Value ?? "";

            var query = _context.Messages
                .Include(m => m.SenderUser)
                .AsQueryable();

            // Role-based filtering
            if (userRole == "Client")
            {
                // Clients can see messages sent to them OR messages they sent
                query = query.Where(m => 
                    (m.RecipientUserId == currentUserId.Value || m.SenderUserId == currentUserId.Value) 
                    && !m.IsPoolEmail);
            }
            else
            {
                // Employees (SuperAdmin, Consultant, Receptionist, DATEVManager) can see:
                // 1. Messages sent to them
                // 2. Pool emails
                // 3. Messages they sent
                query = query.Where(m => 
                    m.RecipientUserId == currentUserId.Value || 
                    m.SenderUserId == currentUserId.Value ||
                    m.IsPoolEmail);
            }

            var messages = await query
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            var messageDtos = messages.Select(m => new MessageDto(
                m.Id,
                (m.SenderUser?.FirstName ?? "") + " " + (m.SenderUser?.LastName ?? ""),
                m.Subject,
                m.Content.Length > 100 ? m.Content.Substring(0, 100) + "..." : m.Content,
                m.Content,
                m.CreatedAt,
                !m.IsRead,
                m.IsPoolEmail
            )).ToList();

            return Ok(messageDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching messages");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching messages" });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new { error = "unauthorized", message = "User not found" });
            }

            var message = await _context.Messages
                .Include(m => m.SenderUser)
                .Include(m => m.RecipientUser)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (message == null)
            {
                return NotFound(new { error = "not_found", message = $"Message {id} not found" });
            }

            // Check if user has access to this message
            if (message.RecipientUserId != currentUserId.Value && message.SenderUserId != currentUserId.Value)
            {
                var userRole = User.FindFirst("role")?.Value;
                if (userRole != "SuperAdmin")
                {
                    return Forbid();
                }
            }

            // Mark as read if current user is recipient
            if (message.RecipientUserId == currentUserId.Value && !message.IsRead)
            {
                message.IsRead = true;
                message.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            var messageDto = new MessageDto(
                message.Id,
                (message.SenderUser?.FirstName ?? "") + " " + (message.SenderUser?.LastName ?? ""),
                message.Subject,
                message.Content.Length > 100 ? message.Content.Substring(0, 100) + "..." : message.Content,
                message.Content,
                message.CreatedAt,
                !message.IsRead,
                message.IsPoolEmail
            );

            return Ok(messageDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching message {MessageId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error fetching message" });
        }
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        try
        {
            var message = await _context.Messages.FirstOrDefaultAsync(m => m.Id == id);

            if (message == null)
            {
                return NotFound(new { error = "not_found", message = $"Message {id} not found" });
            }

            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Message marked as read" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking message as read {MessageId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error marking message as read" });
        }
    }

    /// <summary>
    /// Send a new message. Clients can only reply to users who previously messaged them.
    /// </summary>
    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new { error = "unauthorized", message = "User not found" });
            }

            // Get user role from claims, default to empty if not found
            var userRole = User.FindFirst("role")?.Value ?? "";

            // Validate recipient exists and is active
            var recipient = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == request.RecipientUserId && u.IsActive);
            
            if (recipient == null)
            {
                return BadRequest(new { error = "invalid_recipient", message = "Recipient user not found or inactive" });
            }

            // If sender is a Client, validate they can only reply to users who previously messaged them
            if (userRole == "Client")
            {
                var hasReceivedMessage = await _context.Messages
                    .AnyAsync(m => m.SenderUserId == request.RecipientUserId && m.RecipientUserId == currentUserId.Value);

                if (!hasReceivedMessage)
                {
                    return Forbidden(new { 
                        error = "forbidden", 
                        message = "Clients can only reply to staff members who have previously contacted them" 
                    });
                }
            }

            // Create the message
            var message = new Domain.Entities.Messaging.Message
            {
                SenderUserId = currentUserId.Value,
                RecipientUserId = request.RecipientUserId,
                Subject = request.Subject,
                Content = request.Content,
                CaseId = request.CaseId,
                IsRead = false,
                IsPoolEmail = false
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Log message sending to audit trail
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var auditLog = new Domain.Entities.Audit.AuditLog
            {
                UserId = currentUserId.Value,
                Action = "MessageSent",
                EntityType = "Message",
                EntityId = message.Id,
                IpAddress = ipAddress,
                Details = $"Message sent to user {request.RecipientUserId}: {request.Subject}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Message sent from user {SenderId} to user {RecipientId}",
                currentUserId.Value, request.RecipientUserId);

            return Ok(new { 
                success = true,
                message = "Message sent successfully", 
                messageId = message.Id 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message");
            return StatusCode(500, new { success = false, error = "internal_error", message = "Error sending message" });
        }
    }

    /// <summary>
    /// Reply to an existing message
    /// </summary>
    [HttpPost("{id}/reply")]
    public async Task<IActionResult> ReplyToMessage(int id, [FromBody] ReplyMessageRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new { error = "unauthorized", message = "User not found" });
            }

            // Get original message
            var originalMessage = await _context.Messages
                .Include(m => m.SenderUser)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (originalMessage == null)
            {
                return NotFound(new { error = "not_found", message = "Original message not found" });
            }

            // Determine recipient (reply to sender of original message)
            var recipientUserId = originalMessage.SenderUserId ?? originalMessage.RecipientUserId;
            if (recipientUserId == currentUserId.Value)
            {
                // If original sender is null or is current user, reply to recipient instead
                recipientUserId = originalMessage.RecipientUserId;
            }

            // Create reply message
            var replySubject = originalMessage.Subject.StartsWith("Re: ") 
                ? originalMessage.Subject 
                : $"Re: {originalMessage.Subject}";

            var replyMessage = new Domain.Entities.Messaging.Message
            {
                SenderUserId = currentUserId.Value,
                RecipientUserId = recipientUserId,
                Subject = replySubject,
                Content = request.Content,
                CaseId = originalMessage.CaseId,
                IsRead = false,
                IsPoolEmail = false
            };

            _context.Messages.Add(replyMessage);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Reply sent from user {SenderId} to user {RecipientId} for message {OriginalMessageId}",
                currentUserId.Value, recipientUserId, id);

            return Ok(new { 
                message = "Reply sent successfully", 
                messageId = replyMessage.Id 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error replying to message {MessageId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error sending reply" });
        }
    }

    /// <summary>
    /// Delete a message (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMessage(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new { error = "unauthorized", message = "User not found" });
            }

            var userRole = User.FindFirst("role")?.Value;
            
            var message = await _context.Messages.FirstOrDefaultAsync(m => m.Id == id);

            if (message == null)
            {
                return NotFound(new { error = "not_found", message = "Message not found" });
            }

            // Only allow deletion if user is sender, recipient, or SuperAdmin
            if (message.SenderUserId != currentUserId.Value && 
                message.RecipientUserId != currentUserId.Value && 
                userRole != "SuperAdmin")
            {
                return Forbid();
            }

            // Soft delete
            message.IsDeleted = true;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Message {MessageId} deleted by user {UserId}", id, currentUserId.Value);

            return Ok(new { message = "Message deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting message {MessageId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error deleting message" });
        }
    }

    private IActionResult Forbidden(object value)
    {
        return StatusCode(403, value);
    }

    /// <summary>
    /// Webhook endpoint to receive incoming emails and route them to employee roles.
    /// TODO: Integrate with actual email service provider (SendGrid, Mailgun, etc.)
    /// TODO: Add proper authentication/verification for webhook calls
    /// TODO: Implement email parsing and validation
    /// </summary>
    [HttpPost("incoming-email")]
    [AllowAnonymous] // TODO: Add webhook signature verification instead
    public async Task<IActionResult> HandleIncomingEmail([FromBody] IncomingEmailRequest request)
    {
        try
        {
            _logger.LogInformation("Received incoming email to {To} from {From}", request.To, request.From);

            // Check if email is sent to info@nfk-buchhaltung.de
            if (!request.To.Contains("info@nfk-buchhaltung.de", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Email not sent to info@nfk-buchhaltung.de, ignoring");
                return Ok(new { message = "Email received but not for routing" });
            }

            // Get all users with employee roles (SuperAdmin, Consultant, Receptionist, DATEVManager)
            var employeeRoleNames = new[] { "SuperAdmin", "Consultant", "Receptionist", "DATEVManager" };
            var employeeUsers = await _context.UserRoles
                .Include(ur => ur.Role)
                .Include(ur => ur.User)
                .Where(ur => employeeRoleNames.Contains(ur.Role.Name) && ur.User.IsActive)
                .Select(ur => ur.User)
                .Distinct()
                .ToListAsync();

            if (!employeeUsers.Any())
            {
                _logger.LogWarning("No employee users found to route email to");
                return Ok(new { message = "No recipients found" });
            }

            // Create a message for each employee user
            var messages = new List<Domain.Entities.Messaging.Message>();
            foreach (var user in employeeUsers)
            {
                var message = new Domain.Entities.Messaging.Message
                {
                    SenderUserId = null, // External email, no internal sender
                    RecipientUserId = user.Id,
                    Subject = $"[External] {request.Subject}",
                    Content = $"From: {request.From}\nTo: {request.To}\nDate: {DateTime.UtcNow:yyyy-MM-dd HH:mm}\n\n{request.Body}",
                    IsRead = false
                };
                messages.Add(message);
            }

            _context.Messages.AddRange(messages);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Routed email to {Count} employee users", employeeUsers.Count);
            return Ok(new { message = $"Email routed to {employeeUsers.Count} employees" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling incoming email");
            return StatusCode(500, new { error = "internal_error", message = "Error processing email" });
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null ? int.Parse(userIdClaim) : null;
    }
}

/// <summary>
/// DTO for incoming email webhook
/// TODO: Adjust fields based on actual email service provider webhook format
/// </summary>
public class IncomingEmailRequest
{
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}
