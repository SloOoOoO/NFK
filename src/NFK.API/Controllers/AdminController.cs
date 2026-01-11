using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.Admin;
using NFK.Infrastructure.Data;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AdminController> _logger;

    public AdminController(ApplicationDbContext context, ILogger<AdminController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            var users = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            var userDtos = users.Select(u => new UserListDto(
                u.Id,
                u.Email,
                $"{u.FirstName} {u.LastName}",
                u.UserRoles.FirstOrDefault()?.Role.Name ?? "Client",
                u.IsActive,
                u.CreatedAt
            )).ToList();

            return Ok(userDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching users");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching users" });
        }
    }

    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleRequest request)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(new { error = "not_found", message = $"User {id} not found" });
            }

            // Find the role
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == request.Role);
            if (role == null)
            {
                return BadRequest(new { error = "invalid_request", message = $"Role {request.Role} not found" });
            }

            // Remove existing roles
            _context.UserRoles.RemoveRange(user.UserRoles);

            // Add new role
            var userRole = new Domain.Entities.Users.UserRole
            {
                UserId = user.Id,
                RoleId = role.Id
            };

            _context.UserRoles.Add(userRole);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User role updated successfully", role = role.Name });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user role {UserId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error updating user role" });
        }
    }

    [HttpGet("header-text")]
    public IActionResult GetHeaderText()
    {
        // For now, return hardcoded values
        // In a real implementation, these would be stored in database or configuration
        return Ok(new HeaderTextDto(
            "Willkommen zurück",
            "Ihr persönliches Steuerberatungsportal"
        ));
    }

    [HttpPut("header-text")]
    public IActionResult UpdateHeaderText([FromBody] UpdateHeaderTextRequest request)
    {
        try
        {
            // For now, just acknowledge the request
            // In a real implementation, this would save to database or configuration
            _logger.LogInformation("Header text update requested: Title={Title}, Subtitle={Subtitle}", 
                request.WelcomeTitle, request.WelcomeSubtitle);

            return Ok(new { 
                message = "Header text updated successfully",
                data = new HeaderTextDto(request.WelcomeTitle, request.WelcomeSubtitle)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating header text");
            return StatusCode(500, new { error = "internal_error", message = "Error updating header text" });
        }
    }
}
