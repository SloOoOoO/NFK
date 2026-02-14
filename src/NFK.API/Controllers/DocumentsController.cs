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
            // Admin/SuperAdmin/Consultant: See all documents or filtered by clientId/userId
            // Other roles (Receptionist, DATEVManager): No access to documents
            var allowedViewRoles = new[] { "SuperAdmin", "Admin", "Consultant" };
            var canViewAllDocuments = allowedViewRoles.Contains(userRole);

            if (userRole == "Client")
            {
                query = query.Where(d => d.UploadedByUserId == currentUserId.Value);
            }
            else if (canViewAllDocuments)
            {
                // Admins/Consultants can filter by clientId or userId
                if (clientId.HasValue || userId.HasValue)
                {
                    var filterUserId = clientId ?? userId;
                    if (filterUserId.HasValue)
                    {
                        query = query.Where(d => d.UploadedByUserId == filterUserId.Value);
                    }
                }
            }
            else
            {
                // Other roles have no access to documents
                return StatusCode(403, new { error = "forbidden", message = "Keine Berechtigung zum Anzeigen von Dokumenten" });
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

            // 1. Validate file type - allow PDF, PNG, JPG, JPEG, DOCX, XLSX, TXT, ZIP, DOC
            var allowedExtensions = new[] { ".pdf", ".png", ".jpg", ".jpeg", ".docx", ".xlsx", ".txt", ".zip", ".doc" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { 
                    error = "invalid_file_type", 
                    message = $"Dateityp {fileExtension} nicht erlaubt. Erlaubt: PDF, PNG, JPG, DOCX, XLSX, TXT, ZIP, DOC" 
                });
            }

            // 2. Validate file size (max 100 MB)
            const long maxFileSize = 100 * 1024 * 1024; // 100MB in bytes
            if (file.Length > maxFileSize)
            {
                return BadRequest(new { 
                    error = "file_too_large", 
                    message = "Datei zu groß (max. 100 MB)" 
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

            // Log document upload to audit trail
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var auditLog = new Domain.Entities.Audit.AuditLog
            {
                UserId = currentUserId.Value,
                Action = "DocumentUpload",
                EntityType = "Document",
                EntityId = document.Id,
                IpAddress = ipAddress,
                Details = $"Uploaded document: {document.FileName} ({document.FileSize} bytes)",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Set<Domain.Entities.Audit.AuditLog>().Add(auditLog);
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

            // Log document download to audit trail
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var auditLog = new Domain.Entities.Audit.AuditLog
            {
                UserId = currentUserId.Value,
                Action = "DocumentDownload",
                EntityType = "Document",
                EntityId = document.Id,
                IpAddress = ipAddress,
                Details = $"Downloaded document: {document.FileName}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Set<Domain.Entities.Audit.AuditLog>().Add(auditLog);
            await _context.SaveChangesAsync();

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

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new { error = "unauthorized", message = "Nicht authentifiziert" });
            }

            // Get the document
            var document = await _context.Documents
                .Include(d => d.UploadedByUser)
                .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);

            if (document == null)
            {
                return NotFound(new { error = "not_found", message = "Dokument nicht gefunden" });
            }

            // Get user role
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

            var userRole = user?.UserRoles.FirstOrDefault()?.Role?.Name ?? "Client";

            // PERMISSION CHECK:
            // Users can delete their own documents
            // Admin/SuperAdmin/Consultant can delete any document
            var allowedDeleteRoles = new[] { "SuperAdmin", "Admin", "Consultant" };
            var canDeleteAnyDocument = allowedDeleteRoles.Contains(userRole);

            if (!canDeleteAnyDocument && document.UploadedByUserId != currentUserId.Value)
            {
                return StatusCode(403, new { error = "forbidden", message = "Keine Berechtigung zum Löschen dieses Dokuments" });
            }

            // Soft delete
            document.IsDeleted = true;
            document.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Log deletion to audit
            var auditLog = new Domain.Entities.Audit.AuditLog
            {
                UserId = currentUserId.Value,
                Action = "DELETE",
                EntityType = "Document",
                EntityId = document.Id,
                Details = $"Document deleted: {document.FileName}",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Document deleted: {DocumentId} by user: {UserId}", id, currentUserId.Value);

            return Ok(new { message = "Dokument erfolgreich gelöscht" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting document: {DocumentId}", id);
            return StatusCode(500, new { error = "internal_error", message = "Fehler beim Löschen des Dokuments" });
        }
    }
}
