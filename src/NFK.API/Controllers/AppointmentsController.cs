using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.Interfaces;
using NFK.Domain.Entities.Other;
using NFK.Infrastructure.Data;
using System.Security.Claims;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AppointmentsController> _logger;
    private readonly IEmailService _emailService;

    public AppointmentsController(ApplicationDbContext context, ILogger<AppointmentsController> logger, IEmailService emailService)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAppointments()
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new { message = "Nicht authentifiziert" });
            }

            var userId = int.Parse(userIdClaim);
            
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            var userRole = user?.UserRoles.FirstOrDefault()?.Role?.Name ?? "Client";

            var query = _context.Appointments
                .Include(a => a.Client)
                    .ThenInclude(c => c.User)
                .Include(a => a.ConsultantUser)
                .AsQueryable();

            // Filter by role
            var clientRoles = new[] { "Client", "RegisteredUser" };
            if (clientRoles.Contains(userRole, StringComparer.OrdinalIgnoreCase))
            {
                // For clients/registered users, only show appointments where their linked client record matches
                query = query.Where(a => a.Client.UserId == userId);
            }
            else if (string.Equals(userRole, "Assistant", StringComparison.OrdinalIgnoreCase))
            {
                // Assistants see appointments of their assigned consultant (if any)
                var assignedConsultantId = await _context.AssistantAssignments
                    .Where(a => a.AssistantUserId == userId)
                    .Select(a => (int?)a.ConsultantUserId)
                    .FirstOrDefaultAsync();

                if (assignedConsultantId.HasValue)
                {
                    query = query.Where(a => a.ConsultantUserId == assignedConsultantId.Value);
                }
                else
                {
                    // No assigned consultant - show empty list
                    query = query.Where(a => false);
                }
            }

            var appointments = await query
                .OrderBy(a => a.StartTime)
                .Select(a => new
                {
                    a.Id,
                    a.Title,
                    ClientId = a.ClientId,
                    ClientName = a.Client.User.FirstName + " " + a.Client.User.LastName,
                    StartTime = a.StartTime,
                    EndTime = a.EndTime,
                    a.Description,
                    a.Location,
                    a.Status
                })
                .ToListAsync();

            return Ok(appointments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching appointments");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new { message = "Nicht authentifiziert" });
            }

            var userId = int.Parse(userIdClaim);

            // PERMISSION CHECK: Only employees can create appointments (not Clients or RegisteredUsers)
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            var userRole = user?.UserRoles.FirstOrDefault()?.Role?.Name ?? "RegisteredUser";

            // Only employees (Consultant, SuperAdmin, Receptionist, Assistant) can create appointments
            var employeeRoles = new[] { "SuperAdmin", "Consultant", "Receptionist", "Assistant" };
            if (!employeeRoles.Contains(userRole))
            {
                _logger.LogWarning("User {UserId} with role {Role} attempted to create appointment - permission denied", userId, userRole);
                return StatusCode(403, new { error = "forbidden", message = "Nur Mitarbeiter können Termine erstellen" });
            }

            if (!DateTime.TryParse(dto.StartTime, out var startTime))
            {
                return BadRequest(new { message = "Ungültiges Startdatum" });
            }

            if (!DateTime.TryParse(dto.EndTime, out var endTime))
            {
                return BadRequest(new { message = "Ungültiges Enddatum" });
            }

            if (endTime <= startTime)
            {
                return BadRequest(new { message = "Enddatum muss nach dem Startdatum liegen" });
            }

            var appointment = new Appointment
            {
                ClientId = dto.ClientId,
                Title = dto.Title,
                StartTime = startTime,
                EndTime = endTime,
                Description = dto.Description,
                Location = dto.Location,
                Status = "Scheduled",
                ConsultantUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            // Log appointment creation to audit trail
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var auditLog = new Domain.Entities.Audit.AuditLog
            {
                UserId = userId,
                Action = "CREATE",
                EntityType = "Appointment",
                EntityId = appointment.Id,
                IpAddress = ipAddress,
                Details = $"Appointment created: {appointment.Title}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Set<Domain.Entities.Audit.AuditLog>().Add(auditLog);
            await _context.SaveChangesAsync();

            // Notify client: create internal message and send email
            try
            {
                var clientRecord = await _context.Clients
                    .Include(c => c.User)
                    .FirstOrDefaultAsync(c => c.Id == dto.ClientId);

                if (clientRecord?.User != null)
                {
                    var clientUser = clientRecord.User;

                    // Internal message notification
                    var notificationMessage = new Domain.Entities.Messaging.Message
                    {
                        SenderUserId = userId,
                        RecipientUserId = clientUser.Id,
                        Subject = $"Neuer Termin: {appointment.Title}",
                        Content = $"Ein neuer Termin wurde für Sie vereinbart.\n\nTitel: {appointment.Title}\nBeginn: {appointment.StartTime:dd.MM.yyyy HH:mm} Uhr\nEnde: {appointment.EndTime:dd.MM.yyyy HH:mm} Uhr"
                            + (string.IsNullOrWhiteSpace(appointment.Location) ? "" : $"\nOrt: {appointment.Location}")
                            + (string.IsNullOrWhiteSpace(appointment.Description) ? "" : $"\nBeschreibung: {appointment.Description}"),
                        IsRead = false
                    };
                    _context.Messages.Add(notificationMessage);
                    await _context.SaveChangesAsync();

                    // Email notification (non-blocking; exceptions are caught and logged)
                    var emailTask = _emailService.SendAppointmentNotificationAsync(
                        clientUser.Email,
                        clientUser.FirstName,
                        appointment.Title,
                        appointment.StartTime,
                        appointment.EndTime,
                        appointment.Description,
                        appointment.Location
                    );
                    _ = emailTask.ContinueWith(t =>
                    {
                        if (t.IsFaulted)
                            _logger.LogWarning(t.Exception?.GetBaseException(), "Failed to send appointment email notification to {Email}", clientUser.Email);
                    }, TaskContinuationOptions.OnlyOnFaulted);
                }
            }
            catch (Exception notifyEx)
            {
                _logger.LogWarning(notifyEx, "Failed to send appointment notification for appointment {AppointmentId}", appointment.Id);
            }

            _logger.LogInformation("Appointment created successfully by user {UserId}", userId);

            return Ok(new
            {
                success = true,
                message = "Termin erfolgreich erstellt",
                appointment
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating appointment");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAppointment(int id, [FromBody] UpdateAppointmentDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new { message = "Nicht authentifiziert" });
            }

            var userId = int.Parse(userIdClaim);

            var appointment = await _context.Appointments
                .Include(a => a.Client)
                .FirstOrDefaultAsync(a => a.Id == id);
            
            if (appointment == null)
                return NotFound(new { message = "Termin nicht gefunden" });

            // Check permissions: user must be the consultant or the client
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            var userRole = user?.UserRoles.FirstOrDefault()?.Role?.Name ?? "Client";

            if (userRole == "Client" && appointment.Client.UserId != userId)
            {
                return StatusCode(403, new { message = "Keine Berechtigung für diesen Termin" });
            }

            if (!DateTime.TryParse(dto.StartTime, out var startTime))
            {
                return BadRequest(new { message = "Ungültiges Startdatum" });
            }

            if (!DateTime.TryParse(dto.EndTime, out var endTime))
            {
                return BadRequest(new { message = "Ungültiges Enddatum" });
            }

            if (endTime <= startTime)
            {
                return BadRequest(new { message = "Enddatum muss nach dem Startdatum liegen" });
            }

            appointment.Title = dto.Title;
            appointment.StartTime = startTime;
            appointment.EndTime = endTime;
            appointment.Description = dto.Description;
            appointment.Location = dto.Location;
            appointment.UpdatedAt = DateTime.UtcNow;

            _context.Appointments.Update(appointment);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Termin aktualisiert" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating appointment");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAppointment(int id)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new { message = "Nicht authentifiziert" });
            }

            var userId = int.Parse(userIdClaim);

            var appointment = await _context.Appointments
                .Include(a => a.Client)
                .FirstOrDefaultAsync(a => a.Id == id);
            
            if (appointment == null)
                return NotFound(new { message = "Termin nicht gefunden" });

            // Check permissions: user must be the consultant or the client
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            var userRole = user?.UserRoles.FirstOrDefault()?.Role?.Name ?? "Client";

            if (userRole == "Client" && appointment.Client.UserId != userId)
            {
                return StatusCode(403, new { message = "Keine Berechtigung für diesen Termin" });
            }

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Termin gelöscht" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting appointment");
            return StatusCode(500, new { message = ex.Message });
        }
    }
}

public class CreateAppointmentDto
{
    public int ClientId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
}

public class UpdateAppointmentDto
{
    public string Title { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
}
