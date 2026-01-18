using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    public AppointmentsController(ApplicationDbContext context, ILogger<AppointmentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAppointments()
    {
        try
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            
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
            if (userRole == "Client")
            {
                // For clients, filter appointments where the appointment's client's userId matches the current user
                query = query.Where(a => a.Client.UserId == userId);
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
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var appointment = new Appointment
            {
                ClientId = dto.ClientId,
                Title = dto.Title,
                StartTime = DateTime.Parse(dto.StartTime),
                EndTime = DateTime.Parse(dto.EndTime),
                Description = dto.Description,
                Location = dto.Location,
                Status = "Scheduled",
                ConsultantUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

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
            var appointment = await _context.Appointments.FindAsync(id);
            
            if (appointment == null)
                return NotFound(new { message = "Termin nicht gefunden" });

            appointment.Title = dto.Title;
            appointment.StartTime = DateTime.Parse(dto.StartTime);
            appointment.EndTime = DateTime.Parse(dto.EndTime);
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
            var appointment = await _context.Appointments.FindAsync(id);
            
            if (appointment == null)
                return NotFound(new { message = "Termin nicht gefunden" });

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
