using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.Events;
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
                .Where(a => a.StartTime >= DateTime.UtcNow)
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
