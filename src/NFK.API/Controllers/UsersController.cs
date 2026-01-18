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
            // Allow search with 1 character minimum
            if (string.IsNullOrWhiteSpace(query) || query.Length < 1)
            {
                return Ok(new List<object>());
            }

            var searchTerm = query.ToLower().Trim();
            
            var users = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Where(u => u.IsActive && !u.IsDeleted)
                .Where(u => 
                    u.FirstName.ToLower().Contains(searchTerm) ||
                    u.LastName.ToLower().Contains(searchTerm) ||
                    u.Email.ToLower().Contains(searchTerm) ||
                    (u.FirstName + " " + u.LastName).ToLower().Contains(searchTerm)
                )
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .Take(20) // Show up to 20 results
                .Select(u => new {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    Role = u.UserRoles.FirstOrDefault() != null 
                        ? u.UserRoles.FirstOrDefault().Role.Name 
                        : "User",
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
