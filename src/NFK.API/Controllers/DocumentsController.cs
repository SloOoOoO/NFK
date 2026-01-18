using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.Documents;
using NFK.Domain.Entities.Documents;
using NFK.Infrastructure.Data;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(ApplicationDbContext context, ILogger<DocumentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? userId = null)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new { error = "unauthorized", message = "User not found" });
            }

            var userRole = User.FindFirst("role")?.Value;
            if (string.IsNullOrEmpty(userRole))
            {
                return Unauthorized(new { error = "unauthorized", message = "User role not found" });
            }

            var query = _context.Documents
                .Include(d => d.Case)
                    .ThenInclude(c => c!.Client)
                        .ThenInclude(cl => cl.User)
                .AsQueryable();

            // Role-based filtering
            if (userRole == "Client")
            {
                // Clients can only see documents for cases belonging to their client record
                query = query.Where(d => 
                    d.Case != null && 
                    d.Case.Client.UserId == currentUserId.Value);
            }
            else
            {
                // SuperAdmin, Consultant, DATEVManager, Receptionist see all documents
                // But can filter by userId if provided
                if (userId.HasValue)
                {
                    query = query.Where(d => 
                        d.Case != null && 
                        d.Case.Client.UserId == userId.Value);
                }
            }

            var documents = await query
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            var documentDtos = documents.Select(d => new DocumentDto(
                d.Id,
                d.FileName,
                d.FileName,
                d.FileSize,
                d.CaseId,
                d.CreatedAt,
                d.UpdatedAt,
                d.Case?.Client?.CompanyName,
                d.Case?.Client?.UserId,
                d.Case?.Client?.User != null ? $"{d.Case.Client.User.FirstName} {d.Case.Client.User.LastName}" : null
            )).ToList();

            return Ok(documentDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching documents");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching documents" });
        }
    }

    /// <summary>
    /// Upload a document with optional metadata
    /// </summary>
    /// <param name="file">The file to upload</param>
    /// <param name="clientId">Optional client ID</param>
    /// <param name="caseId">Optional case ID</param>
    /// <returns>The uploaded document metadata</returns>
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] int? clientId, [FromForm] int? caseId)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { error = "invalid_request", message = "No file provided" });
            }

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new { error = "unauthorized", message = "User not found" });
            }

            // 1. Validate file type (PDF only)
            if (file.ContentType != "application/pdf")
            {
                return BadRequest(new { error = "invalid_file_type", message = "Nur PDF-Dateien sind erlaubt." });
            }

            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (fileExtension != ".pdf")
            {
                return BadRequest(new { error = "invalid_file_type", message = "Nur PDF-Dateien sind erlaubt." });
            }

            // 2. Validate file size (max 10 MB)
            const long maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
            if (file.Length > maxFileSize)
            {
                return BadRequest(new { 
                    error = "file_too_large", 
                    message = "Datei zu groß. Maximale Größe: 10 MB." 
                });
            }

            // 3. Get user's client ID for document count and storage checks
            var userRole = User.FindFirst("role")?.Value;
            int? userClientId = clientId;

            if (userRole == "Client")
            {
                // For clients, get their client record
                var clientRecord = await _context.Clients
                    .FirstOrDefaultAsync(c => c.UserId == currentUserId.Value);
                if (clientRecord != null)
                {
                    userClientId = clientRecord.Id;
                }
            }

            if (userClientId.HasValue)
            {
                // 4. Check user's document count (max 10)
                var userDocCount = await _context.Documents
                    .CountAsync(d => d.Case != null && d.Case.ClientId == userClientId.Value && !d.IsDeleted);

                if (userDocCount >= 10)
                {
                    return BadRequest(new { error = "document_limit_reached", message = "Maximale Anzahl von 10 Dokumenten erreicht." });
                }

                // 5. Check total storage (max 100 MB)
                var totalSize = await _context.Documents
                    .Where(d => d.Case != null && d.Case.ClientId == userClientId.Value && !d.IsDeleted)
                    .SumAsync(d => (long?)d.FileSize) ?? 0;

                const long maxTotalSize = 100 * 1024 * 1024; // 100 MB
                if (totalSize + file.Length > maxTotalSize)
                {
                    return BadRequest(new { error = "storage_limit_exceeded", message = "Speicherlimit von 100 MB überschritten." });
                }
            }

            // For now, just store metadata (not actual file)
            // In production, you would save to blob storage
            var document = new Document
            {
                FileName = file.FileName,
                FilePath = $"/uploads/{Guid.NewGuid()}_{file.FileName}", // Placeholder path
                FileType = file.ContentType,
                FileSize = file.Length,
                CaseId = caseId,
                UploadedByUserId = currentUserId
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            var response = new UploadDocumentResponse(
                document.Id,
                document.FileName,
                document.FileSize,
                "Document uploaded successfully"
            );

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document");
            return StatusCode(500, new { error = "internal_error", message = "Error uploading document" });
        }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new { error = "unauthorized", message = "User not found" });
            }

            var userRole = User.FindFirst("role")?.Value;
            int? userClientId = null;

            if (userRole == "Client")
            {
                // For clients, get their client record
                var clientRecord = await _context.Clients
                    .FirstOrDefaultAsync(c => c.UserId == currentUserId.Value);
                if (clientRecord != null)
                {
                    userClientId = clientRecord.Id;
                }
            }

            int documentCount = 0;
            long totalSize = 0;

            if (userClientId.HasValue)
            {
                documentCount = await _context.Documents
                    .CountAsync(d => d.Case != null && d.Case.ClientId == userClientId.Value && !d.IsDeleted);

                totalSize = await _context.Documents
                    .Where(d => d.Case != null && d.Case.ClientId == userClientId.Value && !d.IsDeleted)
                    .SumAsync(d => (long?)d.FileSize) ?? 0;
            }

            return Ok(new { 
                documentCount,
                totalSize,
                maxDocuments = 10,
                maxTotalSize = 100 * 1024 * 1024 // 100 MB
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching document stats");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching document stats" });
        }
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(int id)
    {
        try
        {
            var document = await _context.Documents.FirstOrDefaultAsync(d => d.Id == id);

            if (document == null)
            {
                return NotFound(new { error = "not_found", message = $"Document {id} not found" });
            }

            // In production, retrieve actual file from blob storage
            // For now, return placeholder
            return Ok(new { 
                message = "Download endpoint placeholder", 
                fileName = document.FileName,
                filePath = document.FilePath 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading document {DocumentId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Error downloading document" });
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null ? int.Parse(userIdClaim) : null;
    }
}
