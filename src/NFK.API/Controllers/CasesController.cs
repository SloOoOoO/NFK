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
            var cases = await _context.Cases
                .Include(c => c.Client)
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
            var caseEntity = await _context.Cases
                .Include(c => c.Client)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (caseEntity == null)
            {
                return NotFound(new { error = "not_found", message = $"Case {id} not found" });
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
}
