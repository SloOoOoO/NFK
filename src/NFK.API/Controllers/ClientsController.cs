using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.Clients;
using NFK.Domain.Entities.Clients;
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
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new { error = "unauthorized", message = "Nicht authentifiziert" });
            }

            // Get user role
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

            var userRole = user?.UserRoles.FirstOrDefault()?.Role?.Name ?? "Client";

            var query = _context.Clients
                .AsNoTracking() // Performance: Read-only query
                .Include(c => c.User)
                .AsQueryable();

            // ROLE-BASED FILTERING:
            // Clients: Only see their own client record
            // Admin/SuperAdmin/Consultant/Receptionist: See all clients
            var allowedViewRoles = new[] { "SuperAdmin", "Admin", "Consultant", "Receptionist", "DATEVManager" };
            var canViewAllClients = allowedViewRoles.Contains(userRole);

            if (userRole == "Client")
            {
                // Client can only see their own record
                query = query.Where(c => c.UserId == currentUserId.Value);
            }
            else if (!canViewAllClients)
            {
                // Other roles have no access to clients
                return StatusCode(403, new { error = "forbidden", message = "Keine Berechtigung zum Anzeigen von Klienten" });
            }

            var clients = await query
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var clientDtos = clients.Select(c => new ClientDto(
                c.Id,
                c.CompanyName,
                c.User.Email,
                c.User.FirstName + " " + c.User.LastName,
                c.IsActive ? "Aktiv" : "Inaktiv",
                c.PhoneNumber,
                c.TaxNumber,
                c.UpdatedAt?.ToString("dd.MM.yyyy") ?? c.CreatedAt.ToString("dd.MM.yyyy"),
                c.Address,
                c.City,
                c.PostalCode,
                c.CreatedAt,
                c.UpdatedAt
            )).ToList();

            return Ok(clientDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching clients");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching clients" });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new { error = "unauthorized", message = "Nicht authentifiziert" });
            }

            var client = await _context.Clients
                .AsNoTracking() // Performance: Read-only query
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (client == null)
            {
                return NotFound(new { error = "not_found", message = $"Client {id} not found" });
            }

            // Get user role
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

            var userRole = user?.UserRoles.FirstOrDefault()?.Role?.Name ?? "Client";

            // PERMISSION CHECK:
            // Clients: Only view their own client record
            // Admin/SuperAdmin/Consultant/Receptionist: View any client
            var allowedViewRoles = new[] { "SuperAdmin", "Admin", "Consultant", "Receptionist", "DATEVManager" };
            var canViewAllClients = allowedViewRoles.Contains(userRole);

            if (userRole == "Client" && client.UserId != currentUserId.Value)
            {
                return StatusCode(403, new { error = "forbidden", message = "Keine Berechtigung für diesen Klienten" });
            }
            else if (!canViewAllClients && userRole != "Client")
            {
                return StatusCode(403, new { error = "forbidden", message = "Keine Berechtigung zum Anzeigen von Klienten" });
            }

            var clientDto = new ClientDto(
                client.Id,
                client.CompanyName,
                client.User.Email,
                client.User.FirstName + " " + client.User.LastName,
                client.IsActive ? "Aktiv" : "Inaktiv",
                client.PhoneNumber,
                client.TaxNumber,
                client.UpdatedAt?.ToString("dd.MM.yyyy") ?? client.CreatedAt.ToString("dd.MM.yyyy"),
                client.Address,
                client.City,
                client.PostalCode,
                client.CreatedAt,
                client.UpdatedAt
            );

            return Ok(clientDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching client {ClientId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error fetching client" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateClientRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new { error = "unauthorized", message = "Nicht authentifiziert" });
            }

            // Get user role - PERMISSION CHECK: Only Admin/SuperAdmin/Consultant can create clients
            var currentUser = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

            var userRole = currentUser?.UserRoles.FirstOrDefault()?.Role?.Name ?? "RegisteredUser";

            // Only Admin, SuperAdmin, and Consultant can create new clients (mandants)
            var allowedRoles = new[] { "SuperAdmin", "Admin", "Consultant" };
            if (!allowedRoles.Contains(userRole))
            {
                _logger.LogWarning("User {UserId} with role {Role} attempted to create client - permission denied", currentUserId, userRole);
                return StatusCode(403, new { error = "forbidden", message = "Nur Admin und Steuerberater können neue Mandanten erstellen" });
            }

            // Validate that userId is provided in request to link to existing user
            if (request.UserId == null || request.UserId <= 0)
            {
                return BadRequest(new { error = "invalid_request", message = "UserId ist erforderlich" });
            }

            // Find the user to be made a client
            var targetUser = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == request.UserId);
            
            if (targetUser == null)
            {
                return BadRequest(new { error = "invalid_request", message = "Benutzer nicht gefunden" });
            }

            // Check if user already has a client record
            var existingClient = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == request.UserId);
            if (existingClient != null)
            {
                return BadRequest(new { error = "invalid_request", message = "Benutzer ist bereits ein Mandant" });
            }

            // Assign Client role to user if they don't have it
            var clientRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Client");
            if (clientRole != null)
            {
                var hasClientRole = targetUser.UserRoles.Any(ur => ur.RoleId == clientRole.Id);
                if (!hasClientRole)
                {
                    // Remove RegisteredUser role if present
                    var registeredUserRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "RegisteredUser");
                    if (registeredUserRole != null)
                    {
                        var registeredUserRoleToRemove = targetUser.UserRoles.FirstOrDefault(ur => ur.RoleId == registeredUserRole.Id);
                        if (registeredUserRoleToRemove != null)
                        {
                            _context.UserRoles.Remove(registeredUserRoleToRemove);
                        }
                    }

                    // Add Client role
                    var newUserRole = new Domain.Entities.Users.UserRole
                    {
                        UserId = targetUser.Id,
                        RoleId = clientRole.Id
                    };
                    _context.UserRoles.Add(newUserRole);
                }
            }

            // Create Client record
            var client = new Client
            {
                UserId = request.UserId.Value,
                CompanyName = request.Name,
                PhoneNumber = request.Phone,
                Address = request.Address,
                City = request.City,
                PostalCode = request.PostalCode,
                TaxNumber = request.TaxNumber,
                IsActive = true
            };

            _context.Clients.Add(client);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Client created successfully by user {UserId} for user {TargetUserId}", currentUserId, request.UserId);

            var clientDto = new ClientDto(
                client.Id,
                client.CompanyName,
                targetUser.Email,
                request.Contact ?? $"{targetUser.FirstName} {targetUser.LastName}",
                "Aktiv",
                client.PhoneNumber,
                client.TaxNumber,
                DateTime.UtcNow.ToString("dd.MM.yyyy"),
                client.Address,
                client.City,
                client.PostalCode,
                client.CreatedAt,
                client.UpdatedAt
            );

            return CreatedAtAction(nameof(GetById), new { id = client.Id }, clientDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating client");
            return StatusCode(500, new { error = "internal_error", message = "Error creating client" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateClientRequest request)
    {
        try
        {
            var client = await _context.Clients
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (client == null)
            {
                return NotFound(new { error = "not_found", message = $"Client {id} not found" });
            }

            client.CompanyName = request.Name;
            client.PhoneNumber = request.Phone;
            client.Address = request.Address ?? client.Address;
            client.City = request.City ?? client.City;
            client.PostalCode = request.PostalCode ?? client.PostalCode;
            if (!string.IsNullOrEmpty(request.Status))
            {
                client.IsActive = request.Status == "Aktiv";
            }

            await _context.SaveChangesAsync();

            var clientDto = new ClientDto(
                client.Id,
                client.CompanyName,
                client.User.Email,
                request.Contact,
                client.IsActive ? "Aktiv" : "Inaktiv",
                client.PhoneNumber,
                client.TaxNumber,
                client.UpdatedAt?.ToString("dd.MM.yyyy") ?? client.CreatedAt.ToString("dd.MM.yyyy"),
                client.Address,
                client.City,
                client.PostalCode,
                client.CreatedAt,
                client.UpdatedAt
            );

            return Ok(clientDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating client {ClientId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error updating client" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == id);

            if (client == null)
            {
                return NotFound(new { error = "not_found", message = $"Client {id} not found" });
            }

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Client deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting client {ClientId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error deleting client" });
        }
    }
    
    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null ? int.Parse(userIdClaim) : null;
    }
}
