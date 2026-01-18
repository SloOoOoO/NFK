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
    public async Task<IActionResult> GetAll()
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
                .AsQueryable();

            // Role-based filtering
            if (userRole == "Client")
            {
                // Clients can only see documents for cases belonging to their client record
                query = query.Where(d => 
                    d.Case != null && 
                    d.Case.Client.UserId == currentUserId.Value);
            }
            else if (userRole == "Receptionist")
            {
                // Receptionists can only see documents they uploaded
                query = query.Where(d => d.UploadedByUserId == currentUserId.Value);
            }
            // SuperAdmin, Consultant, DATEVManager see all documents (no filter)

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
                d.UpdatedAt
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

            // Validate file size (max 10MB)
            const long maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
            if (file.Length > maxFileSize)
            {
                return BadRequest(new { 
                    error = "file_too_large", 
                    message = $"File size exceeds the maximum limit of {maxFileSize / (1024 * 1024)}MB" 
                });
            }

            // Validate file type
            var allowedExtensions = new[] { ".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg" };
            var allowedMimeTypes = new[] { 
                "application/pdf", 
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "image/png",
                "image/jpeg"
            };

            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { 
                    error = "invalid_file_type", 
                    message = $"File type '{fileExtension}' is not allowed. Allowed types: {string.Join(", ", allowedExtensions)}" 
                });
            }

            if (!allowedMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
            {
                return BadRequest(new { 
                    error = "invalid_mime_type", 
                    message = $"MIME type '{file.ContentType}' is not allowed" 
                });
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
                UploadedByUserId = GetCurrentUserId()
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
