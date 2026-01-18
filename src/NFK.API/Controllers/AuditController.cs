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
            var query = _context.AuditLogs
                .Include(a => a.User)
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
}
