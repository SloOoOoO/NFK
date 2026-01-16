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

            var messages = await _context.Messages
                .Include(m => m.SenderUser)
                .Where(m => m.RecipientUserId == currentUserId.Value)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            var messageDtos = messages.Select(m => new MessageDto(
                m.Id,
                m.SenderUser.FirstName + " " + m.SenderUser.LastName,
                m.Subject,
                m.Content.Length > 100 ? m.Content.Substring(0, 100) + "..." : m.Content,
                m.Content,
                m.CreatedAt,
                !m.IsRead
            )).ToList();

            return Ok(messageDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching messages");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching messages" });
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
