using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.Events;
using NFK.Domain.Entities.Other;
using NFK.Infrastructure.Data;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class EventsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<EventsController> _logger;

    public EventsController(ApplicationDbContext context, ILogger<EventsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var appointments = await _context.Appointments
                .Include(a => a.Client)
                .Where(a => !a.IsDeleted)
                .OrderBy(a => a.StartTime)
                .ToListAsync();

            var eventDtos = appointments.Select(a => new EventDto(
                a.Id,
                a.Title,
                a.Client.CompanyName,
                a.StartTime,
                a.StartTime.ToString("HH:mm"),
                GetEventType(a.Status),
                a.Notes
            )).ToList();

            return Ok(eventDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching events");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching events" });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var appointment = await _context.Appointments
                .Include(a => a.Client)
                .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

            if (appointment == null)
            {
                return NotFound(new { error = "not_found", message = "Event not found" });
            }

            var eventDto = new EventDto(
                appointment.Id,
                appointment.Title,
                appointment.Client.CompanyName,
                appointment.StartTime,
                appointment.StartTime.ToString("HH:mm"),
                GetEventType(appointment.Status),
                appointment.Notes
            );

            return Ok(eventDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching event {EventId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error fetching event" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEventDto dto)
    {
        try
        {
            // Validate client exists
            var client = await _context.Clients
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == dto.ClientId);
            
            if (client == null)
            {
                return BadRequest(new { error = "invalid_client", message = "Client not found" });
            }

            // Parse date and time
            var timeParts = dto.Time.Split(':');
            if (timeParts.Length != 2 || !int.TryParse(timeParts[0], out var hour) || !int.TryParse(timeParts[1], out var minute))
            {
                return BadRequest(new { error = "invalid_time", message = "Invalid time format" });
            }

            var startTime = dto.Date.Date.AddHours(hour).AddMinutes(minute);
            var endTime = startTime.AddHours(1); // Default 1 hour duration

            var appointment = new Appointment
            {
                ClientId = dto.ClientId,
                Title = dto.Title,
                Description = dto.Description,
                StartTime = startTime,
                EndTime = endTime,
                Location = dto.Location,
                Status = "Scheduled",
                Notes = dto.Description
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            // Log email notification (placeholder)
            _logger.LogInformation($"Email notification would be sent to: {client.User.Email}");

            var result = new EventDto(
                appointment.Id,
                appointment.Title,
                client.CompanyName,
                appointment.StartTime,
                appointment.StartTime.ToString("HH:mm"),
                GetEventType(appointment.Status),
                appointment.Notes
            );

            return CreatedAtAction(nameof(GetAll), new { id = appointment.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating event");
            return StatusCode(500, new { error = "internal_error", message = "Error creating event" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEventDto dto)
    {
        try
        {
            var appointment = await _context.Appointments
                .Include(a => a.Client)
                .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

            if (appointment == null)
            {
                return NotFound(new { error = "not_found", message = "Event not found" });
            }

            // Update fields
            appointment.Title = dto.Title;
            appointment.Description = dto.Description;
            appointment.Notes = dto.Description;
            appointment.Location = dto.Location;

            if (dto.Date.HasValue && !string.IsNullOrEmpty(dto.Time))
            {
                var timeParts = dto.Time.Split(':');
                if (timeParts.Length == 2 && int.TryParse(timeParts[0], out var hour) && int.TryParse(timeParts[1], out var minute))
                {
                    var startTime = dto.Date.Value.Date.AddHours(hour).AddMinutes(minute);
                    appointment.StartTime = startTime;
                    appointment.EndTime = startTime.AddHours(1);
                }
            }

            if (!string.IsNullOrEmpty(dto.Status))
            {
                appointment.Status = dto.Status;
            }

            await _context.SaveChangesAsync();

            var result = new EventDto(
                appointment.Id,
                appointment.Title,
                appointment.Client.CompanyName,
                appointment.StartTime,
                appointment.StartTime.ToString("HH:mm"),
                GetEventType(appointment.Status),
                appointment.Notes
            );

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating event {EventId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error updating event" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

            if (appointment == null)
            {
                return NotFound(new { error = "not_found", message = "Event not found" });
            }

            // Soft delete
            appointment.IsDeleted = true;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Event {EventId} deleted", id);

            return Ok(new { message = "Event deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting event {EventId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error deleting event" });
        }
    }

    [HttpPut("{id}/complete")]
    public async Task<IActionResult> Complete(int id)
    {
        try
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

            if (appointment == null)
            {
                return NotFound(new { error = "not_found", message = "Event not found" });
            }

            appointment.Status = "Completed";
            await _context.SaveChangesAsync();

            _logger.LogInformation("Event {EventId} marked as completed", id);

            return Ok(new { message = "Event marked as completed" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing event {EventId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error completing event" });
        }
    }

    private string GetEventType(string status)
    {
        return status switch
        {
            "Scheduled" => "Termin",
            "Confirmed" => "Termin",
            "Cancelled" => "Abgesagt",
            "Completed" => "Abgeschlossen",
            _ => "Termin"
        };
    }
}
