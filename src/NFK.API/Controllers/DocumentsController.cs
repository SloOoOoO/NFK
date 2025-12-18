using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NFK.Infrastructure.Data;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(ApplicationDbContext context, ILogger<DocumentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(new { message = "Get all documents - to be implemented" });
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] IFormFile file)
    {
        return Ok(new { message = "Upload document - to be implemented" });
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(int id)
    {
        return Ok(new { message = $"Download document {id} - to be implemented" });
    }
}
