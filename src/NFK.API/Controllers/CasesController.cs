using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.Cases;
using NFK.Domain.Entities.Clients;
using NFK.Domain.Enums;
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

            var query = _context.Cases
                .Include(c => c.Client)
                    .ThenInclude(cl => cl.User)
                .AsQueryable();

            // ROLE-BASED FILTERING:
            // Clients: Only see their own cases
            // Admin/SuperAdmin/Consultant/Receptionist: See all cases
            var allowedViewRoles = new[] { "SuperAdmin", "Admin", "Consultant", "Receptionist", "DATEVManager" };
            var canViewAllCases = allowedViewRoles.Contains(userRole);

            if (userRole == "Client")
            {
                // Client can only see cases where they are the client
                query = query.Where(c => c.Client.UserId == currentUserId.Value);
            }
            else if (!canViewAllCases)
            {
                // Other roles have no access to cases
                return StatusCode(403, new { error = "forbidden", message = "Keine Berechtigung zum Anzeigen von Fällen" });
            }

            var cases = await query
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var caseDtos = cases.Select(c => new CaseDto(
                c.Id,
                c.Title,
                c.Description,
                c.ClientId,
                c.Client.CompanyName,
                MapCaseStatus(c.Status),
                MapPriority(c.Priority),
                c.DueDate,
                c.CreatedAt,
                c.UpdatedAt
            )).ToList();

            return Ok(caseDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching cases");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching cases" });
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

            var caseEntity = await _context.Cases
                .Include(c => c.Client)
                    .ThenInclude(cl => cl.User)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (caseEntity == null)
            {
                return NotFound(new { error = "not_found", message = $"Case {id} not found" });
            }

            // Get user role
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

            var userRole = user?.UserRoles.FirstOrDefault()?.Role?.Name ?? "Client";

            // PERMISSION CHECK:
            // Clients: Only view their own cases
            // Admin/SuperAdmin/Consultant/Receptionist: View any case
            var allowedViewRoles = new[] { "SuperAdmin", "Admin", "Consultant", "Receptionist", "DATEVManager" };
            var canViewAllCases = allowedViewRoles.Contains(userRole);

            if (userRole == "Client" && caseEntity.Client.UserId != currentUserId.Value)
            {
                return StatusCode(403, new { error = "forbidden", message = "Keine Berechtigung für diesen Fall" });
            }
            else if (!canViewAllCases && userRole != "Client")
            {
                return StatusCode(403, new { error = "forbidden", message = "Keine Berechtigung zum Anzeigen von Fällen" });
            }

            var caseDto = new CaseDto(
                caseEntity.Id,
                caseEntity.Title,
                caseEntity.Description,
                caseEntity.ClientId,
                caseEntity.Client.CompanyName,
                MapCaseStatus(caseEntity.Status),
                MapPriority(caseEntity.Priority),
                caseEntity.DueDate,
                caseEntity.CreatedAt,
                caseEntity.UpdatedAt
            );

            return Ok(caseDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching case {CaseId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error fetching case" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCaseRequest request)
    {
        try
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == request.ClientId);
            if (client == null)
            {
                return BadRequest(new { error = "invalid_request", message = "Client not found" });
            }

            var caseEntity = new Case
            {
                Title = request.Title,
                Description = request.Description,
                ClientId = request.ClientId,
                Status = CaseStatus.New,
                Priority = MapPriorityFromString(request.Priority ?? "Medium"),
                DueDate = request.DueDate
            };

            _context.Cases.Add(caseEntity);
            await _context.SaveChangesAsync();

            var caseDto = new CaseDto(
                caseEntity.Id,
                caseEntity.Title,
                caseEntity.Description,
                caseEntity.ClientId,
                client.CompanyName,
                MapCaseStatus(caseEntity.Status),
                MapPriority(caseEntity.Priority),
                caseEntity.DueDate,
                caseEntity.CreatedAt,
                caseEntity.UpdatedAt
            );

            return CreatedAtAction(nameof(GetById), new { id = caseEntity.Id }, caseDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating case");
            return StatusCode(500, new { error = "internal_error", message = "Error creating case" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCaseRequest request)
    {
        try
        {
            var caseEntity = await _context.Cases
                .Include(c => c.Client)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (caseEntity == null)
            {
                return NotFound(new { error = "not_found", message = $"Case {id} not found" });
            }

            caseEntity.Title = request.Title;
            caseEntity.Description = request.Description ?? caseEntity.Description;
            caseEntity.Status = MapStatusFromString(request.Status ?? MapCaseStatus(caseEntity.Status));
            caseEntity.Priority = MapPriorityFromString(request.Priority ?? MapPriority(caseEntity.Priority));
            caseEntity.DueDate = request.DueDate ?? caseEntity.DueDate;

            await _context.SaveChangesAsync();

            var caseDto = new CaseDto(
                caseEntity.Id,
                caseEntity.Title,
                caseEntity.Description,
                caseEntity.ClientId,
                caseEntity.Client.CompanyName,
                MapCaseStatus(caseEntity.Status),
                MapPriority(caseEntity.Priority),
                caseEntity.DueDate,
                caseEntity.CreatedAt,
                caseEntity.UpdatedAt
            );

            return Ok(caseDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating case {CaseId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error updating case" });
        }
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateCaseStatusRequest request)
    {
        try
        {
            var caseEntity = await _context.Cases
                .Include(c => c.Client)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (caseEntity == null)
            {
                return NotFound(new { error = "not_found", message = $"Case {id} not found" });
            }

            caseEntity.Status = MapStatusFromString(request.Status);
            await _context.SaveChangesAsync();

            var caseDto = new CaseDto(
                caseEntity.Id,
                caseEntity.Title,
                caseEntity.Description,
                caseEntity.ClientId,
                caseEntity.Client.CompanyName,
                MapCaseStatus(caseEntity.Status),
                MapPriority(caseEntity.Priority),
                caseEntity.DueDate,
                caseEntity.CreatedAt,
                caseEntity.UpdatedAt
            );

            return Ok(caseDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating case status {CaseId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error updating case status" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var caseEntity = await _context.Cases.FirstOrDefaultAsync(c => c.Id == id);

            if (caseEntity == null)
            {
                return NotFound(new { error = "not_found", message = $"Case {id} not found" });
            }

            _context.Cases.Remove(caseEntity);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Case deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting case {CaseId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error deleting case" });
        }
    }

    private string MapCaseStatus(CaseStatus status)
    {
        return status switch
        {
            CaseStatus.New => "Neu",
            CaseStatus.InProgress => "In Bearbeitung",
            CaseStatus.Completed => "Abgeschlossen",
            CaseStatus.Cancelled => "Abgebrochen",
            _ => "Neu"
        };
    }

    private CaseStatus MapStatusFromString(string status)
    {
        return status switch
        {
            "Neu" => CaseStatus.New,
            "In Bearbeitung" => CaseStatus.InProgress,
            "Abgeschlossen" => CaseStatus.Completed,
            "Abgebrochen" => CaseStatus.Cancelled,
            _ => CaseStatus.New
        };
    }

    private string MapPriority(int priority)
    {
        return priority switch
        {
            3 => "Hoch",
            2 => "Mittel",
            1 => "Niedrig",
            _ => "Mittel"
        };
    }

    private int MapPriorityFromString(string priority)
    {
        return priority switch
        {
            "Hoch" or "High" => 3,
            "Mittel" or "Medium" => 2,
            "Niedrig" or "Low" => 1,
            _ => 2
        };
    }
    
    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null ? int.Parse(userIdClaim) : null;
    }
}
