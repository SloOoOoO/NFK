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
