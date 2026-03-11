using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.Users;
using NFK.Application.Interfaces;
using NFK.Infrastructure.Data;
using NFK.Infrastructure.Security;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UsersController> _logger;
    private readonly EncryptionService _encryption;
    private readonly IEmailService _emailService;

    public UsersController(ApplicationDbContext context, ILogger<UsersController> logger, EncryptionService encryption, IEmailService emailService)
    {
        _context = context;
        _logger = logger;
        _encryption = encryption;
        _emailService = emailService;
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

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? currentUserIdInt = currentUserId != null && int.TryParse(currentUserId, out var parsedId) ? parsedId : null;

            var userRole = User.FindFirst("role")?.Value ?? "";
            var searchTerm = query.ToLower().Trim();

            var usersQuery = _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Where(u => u.IsActive && !u.IsDeleted)
                // Exclude the current user from search results (don't send messages to yourself)
                .Where(u => currentUserIdInt == null || u.Id != currentUserIdInt.Value)
                .Where(u =>
                    u.FirstName.ToLower().Contains(searchTerm) ||
                    u.LastName.ToLower().Contains(searchTerm) ||
                    u.Email.ToLower().Contains(searchTerm) ||
                    (u.FirstName + " " + u.LastName).ToLower().Contains(searchTerm)
                );

            // For Assistants: scope search to only clients of their assigned consultant
            if (userRole == "Assistant" && currentUserIdInt.HasValue)
            {
                var assignedConsultantId = await _context.AssistantAssignments
                    .Where(a => a.AssistantUserId == currentUserIdInt.Value)
                    .Select(a => (int?)a.ConsultantUserId)
                    .FirstOrDefaultAsync();

                if (assignedConsultantId.HasValue)
                {
                    var clientUserIds = await _context.Clients
                        .Where(c => c.ConsultantUserId == assignedConsultantId.Value)
                        .Select(c => c.UserId)
                        .ToListAsync();
                    usersQuery = usersQuery.Where(u => clientUserIds.Contains(u.Id));
                }
                else
                {
                    return Ok(new List<object>());
                }
            }

            var users = await usersQuery
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

            // Update fields
            // fullLegalName, email, and taxId are NEVER updatable via this endpoint
            
            // Handle both Phone and PhoneNumber
            if (!string.IsNullOrEmpty(dto.Phone))
                user.PhoneNumber = _encryption.Encrypt(dto.Phone);
            if (!string.IsNullOrEmpty(dto.PhoneNumber))
                user.PhoneNumber = _encryption.Encrypt(dto.PhoneNumber);
                
            if (!string.IsNullOrEmpty(dto.Address))
                user.Address = _encryption.Encrypt(dto.Address);
            if (!string.IsNullOrEmpty(dto.City))
                user.City = _encryption.Encrypt(dto.City);
            if (!string.IsNullOrEmpty(dto.PostalCode))
                user.PostalCode = _encryption.Encrypt(dto.PostalCode);
            if (!string.IsNullOrEmpty(dto.Country))
                user.Country = dto.Country;
            if (dto.DateOfBirth.HasValue)
                user.DateOfBirth = dto.DateOfBirth.Value;
            
            // TaxNumber (Steuernummer) is editable; TaxId (Steuer-ID) is never updatable
            if (!string.IsNullOrEmpty(dto.TaxNumber))
                user.TaxNumber = _encryption.Encrypt(dto.TaxNumber);

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
                    Phone = _encryption.SafeDecrypt(user.PhoneNumber),
                    PhoneNumber = _encryption.SafeDecrypt(user.PhoneNumber),
                    Address = _encryption.SafeDecrypt(user.Address),
                    City = _encryption.SafeDecrypt(user.City),
                    PostalCode = _encryption.SafeDecrypt(user.PostalCode),
                    user.Country,
                    user.DateOfBirth,
                    TaxId = _encryption.SafeDecrypt(user.TaxId),
                    TaxNumber = _encryption.SafeDecrypt(user.TaxNumber),
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

    [HttpGet("my-assignment")]
    public async Task<IActionResult> GetMyAssignment()
    {
        try
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Scoped to the current user's own assignment only — no authorization issue
            var assignment = await _context.AssistantAssignments
                .Include(a => a.ConsultantUser)
                .FirstOrDefaultAsync(a => a.AssistantUserId == userId);

            if (assignment == null)
            {
                return NotFound(new { error = "not_found", message = "Keine Zuweisung gefunden" });
            }

            return Ok(new
            {
                consultantUserId = assignment.ConsultantUserId,
                consultantName = $"{assignment.ConsultantUser.FirstName} {assignment.ConsultantUser.LastName}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching assistant assignment");
            return StatusCode(500, new { error = "internal_error", message = "Fehler beim Abrufen der Zuweisung" });
        }
    }

    [HttpPut("receptionist-visibility")]
    [Authorize]
    public async Task<IActionResult> UpdateReceptionistVisibility([FromBody] UpdateReceptionistVisibilityRequest request)
    {
        try
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound(new { message = "Benutzer nicht gefunden" });

            // Only Consultant and SuperAdmin can change this setting
            var allowedRoles = new[] { "Consultant", "SuperAdmin" };
            if (!user.UserRoles.Any(ur => allowedRoles.Contains(ur.Role.Name)))
            {
                return StatusCode(403, new { error = "forbidden", message = "Nur Berater und SuperAdmins können diese Einstellung ändern" });
            }

            user.ReceptionistCanSeeMessages = request.ReceptionistCanSeeMessages;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, receptionistCanSeeMessages = user.ReceptionistCanSeeMessages });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating receptionist visibility");
            return StatusCode(500, new { error = "internal_error", message = "Fehler beim Aktualisieren der Einstellung" });
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
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound(new { error = "not_found", message = "Benutzer nicht gefunden" });
            }

            var userEmail = user.Email;
            var userName = user.FirstName;

            // Send farewell email BEFORE deleting the user record
            try
            {
                await _emailService.SendAccountDeletionEmailAsync(userEmail, userName);
            }
            catch (Exception emailEx)
            {
                _logger.LogWarning(emailEx, "Failed to send deletion email to {Email}", userEmail);
            }

            // Hard delete: delete physical document files first
            var docFilePaths = await _context.Documents
                .Where(d => d.UploadedByUserId == userId)
                .Select(d => d.FilePath)
                .ToListAsync();

            foreach (var filePath in docFilePaths.Where(p => !string.IsNullOrEmpty(p)))
            {
                try
                {
                    if (System.IO.File.Exists(filePath))
                        System.IO.File.Delete(filePath!);
                }
                catch (Exception fileEx)
                {
                    _logger.LogWarning(fileEx, "Failed to delete physical file {FilePath}", filePath);
                }
            }

            // Hard delete using direct SQL to bypass the soft-delete SaveChangesAsync override.
            // Deletion order respects foreign-key constraints (children before parent).
            // All SQL operations are wrapped in a transaction to ensure atomicity.
            await using var transaction = await _context.Database.BeginTransactionAsync();

            // Anonymize messages — preserve conversation history but remove sender/recipient identity
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE Messages SET SenderUserId = NULL WHERE SenderUserId = {userId}");
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE Messages SET RecipientUserId = NULL WHERE RecipientUserId = {userId}");

            // Nullify optional FK references so parent records survive
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE Cases SET AssignedToUserId = NULL WHERE AssignedToUserId = {userId}");
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE Clients SET ConsultantUserId = NULL WHERE ConsultantUserId = {userId}");

            // Delete AssistantAssignments (user may be assistant or consultant)
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM AssistantAssignments WHERE AssistantUserId = {userId} OR ConsultantUserId = {userId}");

            // Delete DocumentComments
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM DocumentComments WHERE UserId = {userId}");

            // Delete Documents (physical files already deleted above)
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM Documents WHERE UploadedByUserId = {userId}");

            // Delete Appointments where this user is consultant (client appointments cascade from Clients delete)
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM Appointments WHERE ConsultantUserId = {userId}");

            // Delete Clients (cascades to Appointments and Cases linked to the client)
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM Clients WHERE UserId = {userId}");

            // Delete authentication and session records
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM EmailVerificationTokens WHERE UserId = {userId}");
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM PasswordHistories WHERE UserId = {userId}");
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM PasswordResetTokens WHERE UserId = {userId}");
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM RefreshTokens WHERE UserId = {userId}");
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM UserSessions WHERE UserId = {userId}");

            // Delete role and permission assignments
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM UserRoles WHERE UserId = {userId}");
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM UserPermissions WHERE UserId = {userId}");

            // Delete audit and tracking records
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM AuditLogs WHERE UserId = {userId}");
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM PageVisits WHERE UserId = {userId}");
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM Notifications WHERE UserId = {userId}");
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM LoginAttempts WHERE Email = {userEmail}");

            // Finally, hard delete the user record itself
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM Users WHERE Id = {userId}");

            await transaction.CommitAsync();

            _logger.LogInformation("User {UserId} ({Email}) hard-deleted their account", userId, userEmail);

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
