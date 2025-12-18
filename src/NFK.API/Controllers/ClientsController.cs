using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NFK.Infrastructure.Data;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ClientsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ClientsController> _logger;

    public ClientsController(ApplicationDbContext context, ILogger<ClientsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // TODO: Implement get all clients
        return Ok(new { message = "Get all clients - to be implemented" });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        // TODO: Implement get client by id
        return Ok(new { message = $"Get client {id} - to be implemented" });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] object request)
    {
        // TODO: Implement create client
        return Ok(new { message = "Create client - to be implemented" });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] object request)
    {
        // TODO: Implement update client
        return Ok(new { message = $"Update client {id} - to be implemented" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        // TODO: Implement delete client
        return Ok(new { message = $"Delete client {id} - to be implemented" });
    }
}
