using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.DATEV;
using NFK.Infrastructure.Data;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Roles = "SuperAdmin,DATEVManager")]
public class DATEVController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DATEVController> _logger;

    public DATEVController(ApplicationDbContext context, ILogger<DATEVController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("export")]
    public async Task<IActionResult> Export([FromBody] object request)
    {
        // Placeholder for future implementation
        await Task.CompletedTask;
        return Ok(new { message = "DATEV export - to be implemented" });
    }

    [HttpGet("jobs")]
    public async Task<IActionResult> GetJobs()
    {
        try
        {
            var jobs = await _context.DATEVJobs
                .OrderByDescending(j => j.CreatedAt)
                .ToListAsync();

            var jobDtos = jobs.Select(j => new DATEVJobDto(
                j.Id,
                j.JobName,
                MapJobStatus(j.Status),
                j.StartedAt,
                j.CompletedAt,
                GetJobSummary(j)
            )).ToList();

            return Ok(jobDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching DATEV jobs");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching DATEV jobs" });
        }
    }

    [HttpPost("jobs/{id}/retry")]
    public async Task<IActionResult> RetryJob(int id)
    {
        try
        {
            var job = await _context.DATEVJobs.FirstOrDefaultAsync(j => j.Id == id);

            if (job == null)
            {
                return NotFound(new { error = "not_found", message = $"DATEV job {id} not found" });
            }

            job.Status = "Pending";
            job.RetryCount++;
            await _context.SaveChangesAsync();

            return Ok(new { message = "DATEV job queued for retry" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrying DATEV job {JobId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error retrying DATEV job" });
        }
    }

    private string MapJobStatus(string status)
    {
        return status switch
        {
            "Completed" => "Erfolgreich",
            "Processing" => "Läuft",
            "Failed" => "Fehlgeschlagen",
            "Pending" => "Ausstehend",
            _ => status
        };
    }

    [HttpGet("status")]
    [Authorize]
    public async Task<IActionResult> GetStatus()
    {
        try
        {
            // DATEV connection status should reflect actual OAuth/API connection
            // For now, DATEV is not connected unless there's a real OAuth token or API key
            // This prevents showing false "connected" status
            var isConnected = false; // Default to not connected
            
            var lastSync = await _context.AuditLogs
                .Where(a => a.Action == "DATEVExport" || a.EntityType == "DATEVJob")
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => a.CreatedAt)
                .FirstOrDefaultAsync();

            return Ok(new
            {
                connected = isConnected,
                lastSync = lastSync
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching DATEV status");
            return Ok(new
            {
                connected = false,
                lastSync = (DateTime?)null
            });
        }
    }

    private string GetJobSummary(Domain.Entities.DATEV.DATEVJob job)
    {
        if (job.Status == "Completed")
        {
            return $"Export erfolgreich abgeschlossen am {job.CompletedAt?.ToString("dd.MM.yyyy HH:mm")}";
        }
        else if (job.Status == "Failed")
        {
            return $"Fehler: {job.ErrorMessage ?? "Unbekannter Fehler"}";
        }
        else if (job.Status == "Processing")
        {
            return $"Gestartet am {job.StartedAt?.ToString("dd.MM.yyyy HH:mm")}";
        }
        return "Ausstehend";
    }
}

