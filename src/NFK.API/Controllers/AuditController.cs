using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class AuditController : ControllerBase
{
    private readonly ILogger<AuditController> _logger;

    public AuditController(ILogger<AuditController> logger)
    {
        _logger = logger;
    }

    [HttpGet("logs")]
    public IActionResult GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        try
        {
            // Mock audit logs data for now
            // In a real implementation, this would fetch from database
            var mockLogs = new[]
            {
                new
                {
                    id = 1,
                    timestamp = DateTime.UtcNow.AddHours(-2),
                    user = new { firstName = "Admin", lastName = "User" },
                    action = "UPDATE",
                    entityType = "User",
                    entityId = 5,
                    ipAddress = "192.168.1.100",
                    details = "Updated user profile"
                },
                new
                {
                    id = 2,
                    timestamp = DateTime.UtcNow.AddHours(-5),
                    user = new { firstName = "Staff", lastName = "Member" },
                    action = "CREATE",
                    entityType = "Client",
                    entityId = 12,
                    ipAddress = "192.168.1.101",
                    details = "Created new client"
                },
                new
                {
                    id = 3,
                    timestamp = DateTime.UtcNow.AddDays(-1),
                    user = new { firstName = "User", lastName = "One" },
                    action = "DELETE",
                    entityType = "Document",
                    entityId = 8,
                    ipAddress = "192.168.1.102",
                    details = "Deleted document"
                },
                new
                {
                    id = 4,
                    timestamp = DateTime.UtcNow.AddDays(-2),
                    user = new { firstName = "User", lastName = "Two" },
                    action = "LOGIN",
                    entityType = "Session",
                    entityId = 0,
                    ipAddress = "192.168.1.103",
                    details = "User logged in"
                },
                new
                {
                    id = 5,
                    timestamp = DateTime.UtcNow.AddDays(-3),
                    user = new { firstName = "Admin", lastName = "User" },
                    action = "UPDATE",
                    entityType = "Case",
                    entityId = 3,
                    ipAddress = "192.168.1.100",
                    details = "Updated case status"
                }
            };

            return Ok(mockLogs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching audit logs");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching audit logs" });
        }
    }
}
