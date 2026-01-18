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
    public async Task<IActionResult> GetAll([FromQuery] int? userId = null, [FromQuery] int? clientId = null)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new { error = "unauthorized", message = "Nicht authentifiziert" });
            }

            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

            if (user == null)
            {
                return NotFound(new { error = "not_found", message = "Benutzer nicht gefunden" });
            }

            var userRole = user.UserRoles.FirstOrDefault()?.Role?.Name ?? "Client";

            var query = _context.Documents
                .Include(d => d.UploadedByUser)
                .Include(d => d.Case)
                    .ThenInclude(c => c!.Client)
                        .ThenInclude(cl => cl.User)
                .Where(d => !d.IsDeleted)
                .AsQueryable();

            // ROLE-BASED FILTERING:
            // Clients: Only see their own documents (uploaded by them)
            // Employees (SuperAdmin, DATEVManager, Consultant): See all documents
            if (userRole == "Client")
            {
                query = query.Where(d => d.UploadedByUserId == currentUserId.Value);
            }
            else if (clientId.HasValue || userId.HasValue)
            {
                var filterUserId = clientId ?? userId;
                if (filterUserId.HasValue)
                {
                    query = query.Where(d => d.UploadedByUserId == filterUserId.Value);
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
                d.UploadedByUserId,
                d.UploadedByUser != null ? $"{d.UploadedByUser.FirstName} {d.UploadedByUser.LastName}" : null
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
                return BadRequest(new { error = "invalid_request", message = "Keine Datei ausgewählt" });
            }

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

            // PERMISSION CHECK: Only Clients can upload documents
            if (userRole != "Client")
            {
                return StatusCode(403, new { error = "forbidden", message = "Nur Klienten können Dokumente hochladen" });
            }

            // 1. Validate file type - allow PDF, PNG, JPG, JPEG, DOCX, XLSX, TXT
            var allowedExtensions = new[] { ".pdf", ".png", ".jpg", ".jpeg", ".docx", ".xlsx", ".txt" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { 
                    error = "invalid_file_type", 
                    message = $"Dateityp {fileExtension} nicht erlaubt. Erlaubt: PDF, PNG, JPG, DOCX, XLSX, TXT" 
                });
            }

            // 2. Validate file size (max 50 MB)
            const long maxFileSize = 50 * 1024 * 1024; // 50MB in bytes
            if (file.Length > maxFileSize)
            {
                return BadRequest(new { 
                    error = "file_too_large", 
                    message = "Datei zu groß (max. 50 MB)" 
                });
            }

            // 3. Get user's client ID for document count and storage checks
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
                    .CountAsync(d => d.UploadedByUserId == currentUserId.Value && !d.IsDeleted);

                if (userDocCount >= 10)
                {
                    return BadRequest(new { error = "document_limit_reached", message = "Maximale Anzahl von 10 Dokumenten erreicht." });
                }

                // 5. Check total storage (max 100 MB)
                var totalSize = await _context.Documents
                    .Where(d => d.UploadedByUserId == currentUserId.Value && !d.IsDeleted)
                    .SumAsync(d => (long?)d.FileSize) ?? 0;

                const long maxTotalSize = 100 * 1024 * 1024; // 100 MB
                if (totalSize + file.Length > maxTotalSize)
                {
                    return BadRequest(new { error = "storage_limit_exceeded", message = "Speicherlimit von 100 MB überschritten." });
                }
            }

            // Create uploads directory if it doesn't exist
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            // Generate unique filename with sanitized extension (already validated above)
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsPath, uniqueFileName);

            // Save file to disk
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var document = new Document
            {
                FileName = file.FileName,
                FilePath = filePath,
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
                "Dokument erfolgreich hochgeladen"
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
                return Unauthorized(new { error = "unauthorized", message = "Nicht authentifiziert" });
            }

            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

            var userRole = user?.UserRoles.FirstOrDefault()?.Role?.Name ?? "Client";
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

            // Count by UploadedByUserId for Clients
            documentCount = await _context.Documents
                .CountAsync(d => d.UploadedByUserId == currentUserId.Value && !d.IsDeleted);

            totalSize = await _context.Documents
                .Where(d => d.UploadedByUserId == currentUserId.Value && !d.IsDeleted)
                .SumAsync(d => (long?)d.FileSize) ?? 0;

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
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new { error = "unauthorized", message = "Nicht authentifiziert" });
            }

            var document = await _context.Documents
                .Include(d => d.UploadedByUser)
                .Include(d => d.Case)
                    .ThenInclude(c => c!.Client)
                .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);

            if (document == null)
            {
                return NotFound(new { error = "not_found", message = $"Dokument {id} nicht gefunden" });
            }

            // Get user role
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

            var userRole = user?.UserRoles.FirstOrDefault()?.Role?.Name ?? "Client";

            // PERMISSION CHECK:
            // Clients: Only download their own documents
            // Employees: Download any document
            if (userRole == "Client" && document.UploadedByUserId != currentUserId.Value)
            {
                return StatusCode(403, new { error = "forbidden", message = "Keine Berechtigung für dieses Dokument" });
            }

            // Check if file exists
            if (!System.IO.File.Exists(document.FilePath))
            {
                _logger.LogError("File not found on disk: {FilePath}", document.FilePath);
                return NotFound(new { error = "file_not_found", message = "Datei nicht auf dem Server gefunden" });
            }

            // Read file and return
            var fileBytes = await System.IO.File.ReadAllBytesAsync(document.FilePath);
            return File(fileBytes, document.FileType, document.FileName);
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
