using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NFK.Infrastructure.Data;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Roles = "SuperAdmin,DATEVManager")]
public class DATEVController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DATEVController> _logger;

    public DATEVController(ApplicationDbContext context, ILogger<DATEVController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("export")]
    public async Task<IActionResult> Export([FromBody] object request)
    {
        return Ok(new { message = "DATEV export - to be implemented" });
    }

    [HttpGet("jobs")]
    public async Task<IActionResult> GetJobs()
    {
        return Ok(new { message = "Get DATEV jobs - to be implemented" });
    }

    [HttpPost("jobs/{id}/retry")]
    public async Task<IActionResult> RetryJob(int id)
    {
        return Ok(new { message = $"Retry DATEV job {id} - to be implemented" });
    }
}
