using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.Users;
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

    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] string? role = null)
    {
        try
        {
            var query = _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Where(u => u.IsActive && !u.IsDeleted)
                .AsQueryable();

            if (!string.IsNullOrEmpty(role))
            {
                query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Name == role));
            }

            var users = await query
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.Gender,
                    FullName = u.FirstName + " " + u.LastName,
                    Role = u.UserRoles.FirstOrDefault() != null 
                        ? u.UserRoles.FirstOrDefault()!.Role.Name 
                        : "User"
                })
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching users");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching users" });
        }
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
                        ? u.UserRoles.FirstOrDefault()!.Role.Name 
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

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        try
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound(new { message = "Benutzer nicht gefunden" });

            // Update fields - handle both field name variations
            if (!string.IsNullOrEmpty(dto.FirstName))
                user.FirstName = dto.FirstName;
            if (!string.IsNullOrEmpty(dto.LastName))
                user.LastName = dto.LastName;
            
            // Handle both Phone and PhoneNumber
            if (!string.IsNullOrEmpty(dto.Phone))
                user.PhoneNumber = dto.Phone;
            if (!string.IsNullOrEmpty(dto.PhoneNumber))
                user.PhoneNumber = dto.PhoneNumber;
                
            if (!string.IsNullOrEmpty(dto.Address))
                user.Address = dto.Address;
            if (!string.IsNullOrEmpty(dto.City))
                user.City = dto.City;
            if (!string.IsNullOrEmpty(dto.PostalCode))
                user.PostalCode = dto.PostalCode;
            if (!string.IsNullOrEmpty(dto.Country))
                user.Country = dto.Country;
            if (dto.DateOfBirth.HasValue)
                user.DateOfBirth = dto.DateOfBirth.Value;
            
            // Handle both TaxNumber and TaxId fields separately
            if (!string.IsNullOrEmpty(dto.TaxId))
                user.TaxId = dto.TaxId;
            if (!string.IsNullOrEmpty(dto.TaxNumber))
                user.TaxNumber = dto.TaxNumber;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { 
                success = true,
                message = "Profil erfolgreich aktualisiert",
                user = new {
                    user.Id,
                    user.FirstName,
                    user.LastName,
                    user.Email,
                    Phone = user.PhoneNumber,
                    PhoneNumber = user.PhoneNumber,
                    user.Address,
                    user.City,
                    user.PostalCode,
                    user.Country,
                    user.DateOfBirth,
                    user.TaxId,
                    user.TaxNumber,
                    user.Gender
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile");
            return StatusCode(500, new { success = false, error = "internal_error", message = "Fehler beim Aktualisieren des Profils" });
        }
    }

    [HttpDelete("profile")]
    [Authorize]
    public async Task<IActionResult> DeleteProfile([FromBody] DeleteProfileRequest request)
    {
        try
        {
            // Validate confirmation text
            if (string.IsNullOrEmpty(request.ConfirmationText))
            {
                return BadRequest(new { error = "invalid_request", message = "Bestätigungstext ist erforderlich" });
            }

            // Check if confirmation text is "delete" reversed (eteled)
            var reversedDelete = new string("delete".Reverse().ToArray());
            if (request.ConfirmationText.ToLower() != reversedDelete)
            {
                return BadRequest(new { error = "invalid_confirmation", message = "Bestätigungstext ist ungültig. Bitte geben Sie 'delete' rückwärts ein." });
            }

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound(new { error = "not_found", message = "Benutzer nicht gefunden" });
            }

            // Soft delete user
            user.IsDeleted = true;
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            // Delete all user's documents
            var userDocuments = await _context.Documents
                .Where(d => d.UploadedByUserId == userId && !d.IsDeleted)
                .ToListAsync();

            foreach (var doc in userDocuments)
            {
                doc.IsDeleted = true;
                
                // Delete physical file if it exists
                if (!string.IsNullOrEmpty(doc.FilePath) && System.IO.File.Exists(doc.FilePath))
                {
                    try
                    {
                        System.IO.File.Delete(doc.FilePath);
                    }
                    catch (Exception fileEx)
                    {
                        _logger.LogWarning(fileEx, "Failed to delete physical file {FilePath}", doc.FilePath);
                    }
                }
            }

            // Soft delete user's messages (sender and receiver)
            var userMessages = await _context.Set<Domain.Entities.Messaging.Message>()
                .Where(m => m.SenderUserId == userId || m.RecipientUserId == userId)
                .ToListAsync();

            foreach (var message in userMessages)
            {
                message.IsDeleted = true;
            }

            // Cancel user's appointments
            var userAppointments = await _context.Set<Domain.Entities.Other.Appointment>()
                .Where(a => a.ClientId == userId || a.ConsultantUserId == userId)
                .ToListAsync();

            foreach (var appointment in userAppointments)
            {
                appointment.Status = "Cancelled";
                appointment.UpdatedAt = DateTime.UtcNow;
            }

            // Log the deletion event
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var auditLog = new Domain.Entities.Audit.AuditLog
            {
                UserId = userId,
                Action = "ProfileDeletion",
                EntityType = "User",
                EntityId = userId,
                IpAddress = ipAddress,
                Details = $"User {user.Email} deleted their profile",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Set<Domain.Entities.Audit.AuditLog>().Add(auditLog);

            await _context.SaveChangesAsync();

            return Ok(new { 
                success = true,
                message = "Profil erfolgreich gelöscht"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting profile");
            return StatusCode(500, new { success = false, error = "internal_error", message = "Fehler beim Löschen des Profils" });
        }
    }
}
