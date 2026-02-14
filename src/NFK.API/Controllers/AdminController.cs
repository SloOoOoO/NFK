using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.Admin;
using NFK.Infrastructure.Data;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin,Consultant")]
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

    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUserDetails(int id)
    {
        try
        {
            // Get current user's ID from claims
            var currentUserIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out var currentUserId))
            {
                return Unauthorized(new { error = "unauthorized", message = "User not authenticated" });
            }

            // Get current user's role
            var currentUser = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == currentUserId);

            var currentUserRole = currentUser?.UserRoles.FirstOrDefault()?.Role.Name;
            
            // Check if user is authorized to view this user's details
            // SuperAdmin, Admin, and Consultant can view any user
            // Other roles can only view their own info
            var isAdminRole = currentUserRole == "SuperAdmin" || currentUserRole == "Admin" || currentUserRole == "Consultant";
            
            if (!isAdminRole && currentUserId != id)
            {
                return Forbid(); // User is trying to view someone else's info
            }

            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(new { error = "not_found", message = $"User {id} not found" });
            }

            // Return different levels of detail based on role
            // Admin roles see all fields, regular users see limited fields
            if (isAdminRole)
            {
                var adminUserDetails = new
                {
                    user.Id,
                    user.Email,
                    user.FirstName,
                    user.LastName,
                    user.PhoneNumber,
                    user.FullLegalName,
                    user.DateOfBirth,
                    user.Address,
                    user.City,
                    user.PostalCode,
                    user.Country,
                    user.TaxId,
                    user.TaxNumber,
                    user.VatId,
                    user.CommercialRegister,
                    user.ClientType,
                    user.CompanyName,
                    user.Salutation,
                    user.FirmLegalName,
                    user.FirmTaxId,
                    user.FirmChamberRegistration,
                    user.FirmAddress,
                    user.FirmCity,
                    user.FirmPostalCode,
                    user.FirmCountry,
                    user.GoogleId,
                    user.DATEVId,
                    user.Gender,
                    user.IsActive,
                    user.IsEmailConfirmed,
                    user.PhoneVerified,
                    Role = user.UserRoles.FirstOrDefault()?.Role.Name ?? "Client",
                    user.CreatedAt,
                    user.UpdatedAt
                };
                return Ok(adminUserDetails);
            }
            else
            {
                // Regular users see only their own basic info
                var basicUserDetails = new
                {
                    user.Id,
                    user.Email,
                    user.FirstName,
                    user.LastName,
                    user.PhoneNumber,
                    user.Address,
                    user.City,
                    user.PostalCode,
                    user.Country,
                    Role = user.UserRoles.FirstOrDefault()?.Role.Name ?? "Client"
                };
                return Ok(basicUserDetails);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user details {UserId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error fetching user details" });
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
            var oldRole = user.UserRoles.FirstOrDefault()?.Role.Name ?? "None";
            _context.UserRoles.RemoveRange(user.UserRoles);

            // Add new role
            var userRole = new Domain.Entities.Users.UserRole
            {
                UserId = user.Id,
                RoleId = role.Id
            };

            _context.UserRoles.Add(userRole);
            await _context.SaveChangesAsync();

            // Log role change to audit trail
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var auditLog = new Domain.Entities.Audit.AuditLog
            {
                UserId = user.Id,
                Action = "RoleChange",
                EntityType = "User",
                EntityId = user.Id,
                IpAddress = ipAddress,
                OldValues = $"Role: {oldRole}",
                NewValues = $"Role: {role.Name}",
                Details = $"User role changed from {oldRole} to {role.Name}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Set<Domain.Entities.Audit.AuditLog>().Add(auditLog);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User role updated successfully", role = role.Name });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user role {UserId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error updating user role" });
        }
    }

    [HttpPut("users/{id}/profile")]
    public async Task<IActionResult> UpdateUserProfile(int id, [FromBody] UpdateUserProfileRequest request)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(new { error = "not_found", message = $"User {id} not found" });
            }

            // Update personal information
            if (request.FirstName != null) user.FirstName = request.FirstName;
            if (request.LastName != null) user.LastName = request.LastName;
            if (request.Email != null) user.Email = request.Email;
            if (request.PhoneNumber != null) user.PhoneNumber = request.PhoneNumber;
            if (request.FullLegalName != null) user.FullLegalName = request.FullLegalName;
            if (request.DateOfBirth.HasValue) user.DateOfBirth = request.DateOfBirth;
            if (request.TaxId != null) user.TaxId = request.TaxId;
            if (request.TaxNumber != null) user.TaxNumber = request.TaxNumber;
            
            // Update address
            if (request.Address != null) user.Address = request.Address;
            if (request.City != null) user.City = request.City;
            if (request.PostalCode != null) user.PostalCode = request.PostalCode;
            if (request.Country != null) user.Country = request.Country;

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "User profile updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile {UserId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error updating user profile" });
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
