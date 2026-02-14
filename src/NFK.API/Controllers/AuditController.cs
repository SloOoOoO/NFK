using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Infrastructure.Data;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Roles = "SuperAdmin,DATEVManager")]
public class AuditController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuditController> _logger;

    public AuditController(ApplicationDbContext context, ILogger<AuditController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        try
        {
            // Filter to only show relevant events: registrations, role changes, and Termine creation
            var query = _context.AuditLogs
                .Include(a => a.User)
                .Where(a => 
                    a.Action == "UserRegistration" || 
                    a.Action == "RoleChange" || 
                    a.Action == "CREATE" && a.EntityType == "Appointment" ||
                    a.EntityType == "User" && a.Action == "CREATE" ||
                    a.EntityType == "User" && a.Details != null && a.Details.Contains("role"))
                .OrderByDescending(a => a.CreatedAt)
                .AsQueryable();

            var total = await query.CountAsync();
            var logs = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new
                {
                    a.Id,
                    Timestamp = a.CreatedAt,
                    User = a.User != null ? $"{a.User.FirstName} {a.User.LastName}" : "System",
                    a.Action,
                    a.EntityType,
                    a.EntityId,
                    a.IpAddress,
                    a.Details
                })
                .ToListAsync();

            return Ok(new
            {
                data = logs,
                total,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(total / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching audit logs");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching audit logs" });
        }
    }

    [HttpGet("recent")]
    [Authorize]
    public async Task<IActionResult> GetRecentActivities()
    {
        try
        {
            var activities = await _context.AuditLogs
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .Take(5)
                .Select(a => new
                {
                    a.Id,
                    Type = a.Action,
                    Description = FormatActivityDescription(a),
                    Timestamp = a.CreatedAt
                })
                .ToListAsync();

            return Ok(activities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching recent activities");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching recent activities" });
        }
    }

    private string FormatActivityDescription(Domain.Entities.Audit.AuditLog log)
    {
        return log.Action switch
        {
            "Upload" => $"Dokument hochgeladen: {log.EntityType}",
            "Download" => $"Dokument heruntergeladen: {log.EntityType}",
            "CreateCase" => "Neuer Fall erstellt",
            "UpdateClient" => "Client aktualisiert",
            "CREATE" => $"{log.EntityType} erstellt",
            "UPDATE" => $"{log.EntityType} aktualisiert",
            "DELETE" => $"{log.EntityType} gelöscht",
            _ => log.Action
        };
    }
}
