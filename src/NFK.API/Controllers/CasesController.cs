using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NFK.Infrastructure.Data;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class CasesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CasesController> _logger;

    public CasesController(ApplicationDbContext context, ILogger<CasesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(new { message = "Get all cases - to be implemented" });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        return Ok(new { message = $"Get case {id} - to be implemented" });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] object request)
    {
        return Ok(new { message = "Create case - to be implemented" });
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] object request)
    {
        return Ok(new { message = $"Update case {id} status - to be implemented" });
    }
}
