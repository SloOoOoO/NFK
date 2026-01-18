using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Infrastructure.Data;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UsersController> _logger;

    public UsersController(ApplicationDbContext context, ILogger<UsersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string query)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return Ok(new List<object>());
            }

            var searchTerm = query.ToLower();
            
            var users = await _context.Users
                .Where(u => u.IsActive && !u.IsDeleted)
                .Where(u => 
                    EF.Functions.Like(u.FirstName.ToLower(), $"%{searchTerm}%") ||
                    EF.Functions.Like(u.LastName.ToLower(), $"%{searchTerm}%") ||
                    EF.Functions.Like(u.Email.ToLower(), $"%{searchTerm}%")
                )
                .Take(10)
                .Select(u => new {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    FullName = u.FirstName + " " + u.LastName,
                    u.Gender
                })
                .ToListAsync();
            
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users");
            return StatusCode(500, new { error = "internal_error", message = "Error searching users" });
        }
    }
}
