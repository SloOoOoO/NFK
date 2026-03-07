using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using NFK.Application.Interfaces;
using NFK.Infrastructure.Data;
using System.ComponentModel.DataAnnotations;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ContactController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IDistributedCache _cache;
    private readonly ILogger<ContactController> _logger;

    private const string ContactEmailAddress = "info@nfk-buchhaltung.de";
    private const int MaxContactsPerHour = 5;

    public ContactController(
        ApplicationDbContext context,
        IEmailService emailService,
        IDistributedCache cache,
        ILogger<ContactController> logger)
    {
        _context = context;
        _emailService = emailService;
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// Submit a contact form message. Sends an email to info@nfk-buchhaltung.de
    /// and creates internal messages for all employee users.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitContactForm([FromBody] ContactFormRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Rate limiting: max 5 requests per IP per hour (skip gracefully if cache is unavailable)
        var ipAddress = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? HttpContext.Connection.RemoteIpAddress?.ToString()
            ?? "unknown";

        var cacheKey = $"contact_ratelimit:{ipAddress}";
        try
        {
            var countStr = await _cache.GetStringAsync(cacheKey);
            var count = string.IsNullOrEmpty(countStr) ? 0 : int.Parse(countStr);

            if (count >= MaxContactsPerHour)
            {
                return StatusCode(429, new { error = "rate_limit_exceeded", message = "Zu viele Anfragen. Bitte versuchen Sie es später erneut." });
            }

            // Increment rate limit counter (1 hour window)
            await _cache.SetStringAsync(cacheKey, (count + 1).ToString(), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
            });
        }
        catch (Exception cacheEx)
        {
            _logger.LogWarning(cacheEx, "Rate limit cache unavailable, skipping rate limiting for IP {IpAddress}", ipAddress);
        }

        try
        {
            // 1. Send email to info@nfk-buchhaltung.de
            await _emailService.SendContactFormEmailAsync(
                ContactEmailAddress,
                request.Name,
                request.Email,
                request.Subject,
                request.Message);

            _logger.LogInformation("Contact form email sent from {Email} ({Name}), subject: {Subject}", request.Email, request.Name, request.Subject);

            // 2. Create internal messages for all employee users
            var employeeRoleNames = new[] { "SuperAdmin", "Consultant", "Receptionist", "DATEVManager" };
            var employeeUsers = await _context.UserRoles
                .Include(ur => ur.Role)
                .Include(ur => ur.User)
                .Where(ur => employeeRoleNames.Contains(ur.Role.Name) && ur.User.IsActive)
                .Select(ur => ur.User)
                .Distinct()
                .ToListAsync();

            if (employeeUsers.Any())
            {
                var messages = employeeUsers.Select(user => new Domain.Entities.Messaging.Message
                {
                    SenderUserId = null,
                    RecipientUserId = user.Id,
                    Subject = $"[Kontaktformular] {request.Subject}",
                    Content = $"Name: {request.Name}\nE-Mail: {request.Email}\nBetreff: {request.Subject}\n\n{request.Message}",
                    IsRead = false
                }).ToList();

                _context.Messages.AddRange(messages);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Contact form message routed to {Count} employee users", employeeUsers.Count);
            }

            return Ok(new { message = "Ihre Nachricht wurde erfolgreich gesendet!" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing contact form submission from {Email}", request.Email);
            return StatusCode(500, new { error = "internal_error", message = "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." });
        }
    }
}

public class ContactFormRequest
{
    [Required(ErrorMessage = "Name ist erforderlich.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Name muss zwischen 2 und 100 Zeichen lang sein.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "E-Mail ist erforderlich.")]
    [EmailAddress(ErrorMessage = "Ungültige E-Mail-Adresse.")]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Betreff ist erforderlich.")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "Betreff muss zwischen 2 und 200 Zeichen lang sein.")]
    public string Subject { get; set; } = string.Empty;

    [Required(ErrorMessage = "Nachricht ist erforderlich.")]
    [StringLength(5000, MinimumLength = 10, ErrorMessage = "Nachricht muss zwischen 10 und 5000 Zeichen lang sein.")]
    public string Message { get; set; } = string.Empty;
}
