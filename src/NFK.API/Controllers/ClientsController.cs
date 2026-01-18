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
            var clients = await _context.Clients
                .AsNoTracking() // Performance: Read-only query
                .Include(c => c.User)
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
            var client = await _context.Clients
                .AsNoTracking() // Performance: Read-only query
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (client == null)
            {
                return NotFound(new { error = "not_found", message = $"Client {id} not found" });
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
}
