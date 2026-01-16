using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.Clients;
using NFK.Domain.Entities.Clients;
using NFK.Domain.Enums;
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

    private static string CalculateHealthStatus(IEnumerable<Case> cases)
    {
        var now = DateTime.UtcNow;
        var activeCases = cases.Where(c => c.Status != CaseStatus.Completed && c.Status != CaseStatus.Cancelled).ToList();

        if (activeCases.Any(c => c.DueDate.HasValue && c.DueDate.Value < now))
        {
            return "critical";
        }

        if (activeCases.Any(c => c.DueDate.HasValue && c.DueDate.Value < now.AddDays(7)))
        {
            return "warning";
        }

        return "healthy";
    }

    private static List<OpenCaseDto> GetOpenCaseDtos(IEnumerable<Case> cases)
    {
        return cases
            .Where(c => c.Status != CaseStatus.Completed && c.Status != CaseStatus.Cancelled)
            .Select(c => new OpenCaseDto(
                c.Id,
                c.Title,
                c.Status.ToString(),
                c.DueDate,
                c.Priority
            ))
            .ToList();
    }

    private static AssignedAdvisorDto? GetAssignedAdvisorDto(Case? assignedCase)
    {
        if (assignedCase?.AssignedToUser == null)
        {
            return null;
        }

        return new AssignedAdvisorDto(
            assignedCase.AssignedToUser.Id,
            $"{assignedCase.AssignedToUser.FirstName} {assignedCase.AssignedToUser.LastName}",
            null
        );
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var clients = await _context.Clients
                .Include(c => c.User)
                .Include(c => c.Cases)
                    .ThenInclude(cs => cs.AssignedToUser)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var clientDtos = clients.Select(c => {
                var healthStatus = CalculateHealthStatus(c.Cases);
                var openCases = GetOpenCaseDtos(c.Cases);
                var assignedCase = c.Cases.FirstOrDefault(cs => cs.AssignedToUserId.HasValue);
                var assignedAdvisor = GetAssignedAdvisorDto(assignedCase);

                return new ClientDto(
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
                    c.UpdatedAt,
                    healthStatus,
                    null,
                    assignedAdvisor,
                    openCases,
                    c.Notes
                );
            }).ToList();

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
            var client = await _context.Clients
                .Include(c => c.User)
                .Include(c => c.Cases)
                    .ThenInclude(cs => cs.AssignedToUser)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (client == null)
            {
                return NotFound(new { error = "not_found", message = $"Client {id} not found" });
            }

            var healthStatus = CalculateHealthStatus(client.Cases);
            var openCases = GetOpenCaseDtos(client.Cases);
            var assignedCase = client.Cases.FirstOrDefault(cs => cs.AssignedToUserId.HasValue);
            var assignedAdvisor = GetAssignedAdvisorDto(assignedCase);

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
                client.UpdatedAt,
                healthStatus,
                null,
                assignedAdvisor,
                openCases,
                client.Notes
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
            // For simplicity, use the first user as the contact
            var firstUser = await _context.Users.FirstOrDefaultAsync();
            if (firstUser == null)
            {
                return BadRequest(new { error = "invalid_request", message = "No users available" });
            }

            var client = new Client
            {
                UserId = firstUser.Id,
                CompanyName = request.Name,
                PhoneNumber = request.Phone,
                IsActive = true
            };

            _context.Clients.Add(client);
            await _context.SaveChangesAsync();

            var clientDto = new ClientDto(
                client.Id,
                client.CompanyName,
                firstUser.Email,
                request.Contact,
                "Aktiv",
                client.PhoneNumber,
                client.TaxNumber,
                DateTime.UtcNow.ToString("dd.MM.yyyy"),
                client.Address,
                client.City,
                client.PostalCode,
                client.CreatedAt,
                client.UpdatedAt,
                "healthy",
                null,
                null,
                new List<OpenCaseDto>(),
                client.Notes
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
                .Include(c => c.Cases)
                    .ThenInclude(cs => cs.AssignedToUser)
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

            var healthStatus = CalculateHealthStatus(client.Cases);
            var openCases = GetOpenCaseDtos(client.Cases);
            var assignedCase = client.Cases.FirstOrDefault(cs => cs.AssignedToUserId.HasValue);
            var assignedAdvisor = GetAssignedAdvisorDto(assignedCase);

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
                client.UpdatedAt,
                healthStatus,
                null,
                assignedAdvisor,
                openCases,
                client.Notes
            );

            return Ok(clientDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating client {ClientId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error updating client" });
        }
    }

    [HttpPut("{id}/notes")]
    public async Task<IActionResult> UpdateNotes(int id, [FromBody] UpdateClientNotesRequest request)
    {
        try
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == id);

            if (client == null)
            {
                return NotFound(new { error = "not_found", message = $"Client {id} not found" });
            }

            client.Notes = request.Notes;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Notes updated successfully", notes = client.Notes });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating notes for client {ClientId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error updating notes" });
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
}
