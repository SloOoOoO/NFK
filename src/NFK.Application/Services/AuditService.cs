using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NFK.Domain.Entities.Audit;
using NFK.Infrastructure.Data;

namespace NFK.Application.Services;

public class AuditService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuditService> _logger;

    public AuditService(ApplicationDbContext context, ILogger<AuditService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Logs an audit event
    /// </summary>
    public async Task LogAsync(
        int? userId, 
        string action, 
        string entityType, 
        int? entityId, 
        string? details, 
        string? ipAddress,
        string? userAgent = null)
    {
        try
        {
            var log = new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityName = entityType, // For backward compatibility
                EntityId = entityId,
                Details = details,
                IpAddress = ipAddress,
                UserAgent = userAgent
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation(
                "Audit log created: User={UserId}, Action={Action}, EntityType={EntityType}, EntityId={EntityId}",
                userId, action, entityType, entityId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create audit log for action: {Action}", action);
            // Don't throw - audit logging should not break the main flow
        }
    }

    /// <summary>
    /// Gets audit logs with optional filtering
    /// </summary>
    public async Task<List<AuditLog>> GetLogsAsync(
        DateTime? startDate = null,
        DateTime? endDate = null,
        string? action = null,
        int? userId = null,
        string? entityType = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = _context.AuditLogs
            .Include(l => l.User)
            .AsQueryable();

        if (startDate.HasValue)
            query = query.Where(l => l.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(l => l.CreatedAt <= endDate.Value);

        if (!string.IsNullOrEmpty(action))
            query = query.Where(l => l.Action == action);

        if (userId.HasValue)
            query = query.Where(l => l.UserId == userId.Value);

        if (!string.IsNullOrEmpty(entityType))
            query = query.Where(l => l.EntityType == entityType);

        return await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    /// <summary>
    /// Gets the total count of audit logs matching the filter criteria
    /// </summary>
    public async Task<int> GetLogsCountAsync(
        DateTime? startDate = null,
        DateTime? endDate = null,
        string? action = null,
        int? userId = null,
        string? entityType = null)
    {
        var query = _context.AuditLogs.AsQueryable();

        if (startDate.HasValue)
            query = query.Where(l => l.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(l => l.CreatedAt <= endDate.Value);

        if (!string.IsNullOrEmpty(action))
            query = query.Where(l => l.Action == action);

        if (userId.HasValue)
            query = query.Where(l => l.UserId == userId.Value);

        if (!string.IsNullOrEmpty(entityType))
            query = query.Where(l => l.EntityType == entityType);

        return await query.CountAsync();
    }
}
