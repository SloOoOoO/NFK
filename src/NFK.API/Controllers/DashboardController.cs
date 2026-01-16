using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Application.DTOs.Dashboard;
using NFK.Infrastructure.Data;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(ApplicationDbContext context, ILogger<DashboardController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("briefing")]
    public async Task<IActionResult> GetBriefing()
    {
        try
        {
            var now = DateTime.UtcNow;
            var twoDaysFromNow = now.AddDays(2);

            // Count urgent deadlines (due in next 48 hours)
            var urgentDeadlines = await _context.Cases
                .Where(c => c.DueDate.HasValue && c.DueDate.Value <= twoDaysFromNow && c.DueDate.Value >= now)
                .CountAsync();

            // Count documents uploaded today
            var today = now.Date;
            var newDocuments = await _context.Documents
                .Where(d => d.CreatedAt.Date == today)
                .CountAsync();

            // Count unread messages (placeholder - implement based on your message system)
            var unreadMessages = await _context.Messages
                .Where(m => !m.IsRead)
                .CountAsync();

            var briefing = new DashboardBriefingDto(
                urgentDeadlines,
                newDocuments,
                unreadMessages
            );

            return Ok(briefing);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching dashboard briefing");
            return StatusCode(500, new { message = "Error fetching briefing data" });
        }
    }

    [HttpGet("performance")]
    public async Task<IActionResult> GetPerformance()
    {
        try
        {
            var now = DateTime.UtcNow;
            var currentMonthStart = new DateTime(now.Year, now.Month, 1);
            var lastMonthStart = currentMonthStart.AddMonths(-1);

            // Count cases closed this month
            var casesThisMonth = await _context.Cases
                .Where(c => c.CompletedAt.HasValue && c.CompletedAt.Value >= currentMonthStart)
                .CountAsync();

            // Count cases closed last month
            var casesLastMonth = await _context.Cases
                .Where(c => c.CompletedAt.HasValue && 
                           c.CompletedAt.Value >= lastMonthStart && 
                           c.CompletedAt.Value < currentMonthStart)
                .CountAsync();

            var trend = casesThisMonth >= casesLastMonth ? "up" : "down";
            var percentageChange = casesLastMonth > 0 
                ? ((decimal)(casesThisMonth - casesLastMonth) / casesLastMonth) * 100 
                : 0;

            var performance = new DashboardPerformanceDto(
                casesThisMonth,
                casesLastMonth,
                trend,
                Math.Round(percentageChange, 1)
            );

            return Ok(performance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching dashboard performance");
            return StatusCode(500, new { message = "Error fetching performance data" });
        }
    }

    [HttpGet("deadlines")]
    public async Task<IActionResult> GetDeadlines()
    {
        try
        {
            var now = DateTime.UtcNow;
            var twoDaysFromNow = now.AddDays(2);

            var cases = await _context.Cases
                .Include(c => c.Client)
                .ThenInclude(c => c.User)
                .Where(c => c.DueDate.HasValue && c.DueDate.Value <= twoDaysFromNow)
                .OrderBy(c => c.DueDate)
                .Take(10)
                .ToListAsync();

            var deadlines = cases.Select(c =>
            {
                var status = c.DueDate < now ? "overdue" : 
                            c.DueDate <= now.AddDays(1) ? "urgent" : "soon";

                return new DeadlineDto(
                    c.Id,
                    c.Client.CompanyName,
                    c.Title,
                    c.DueDate!.Value,
                    status,
                    null
                );
            }).ToList();

            return Ok(deadlines);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching dashboard deadlines");
            return StatusCode(500, new { message = "Error fetching deadlines data" });
        }
    }

    [HttpGet("activities")]
    public async Task<IActionResult> GetActivities()
    {
        try
        {
            var activities = new List<ActivityDto>();

            // Get recent documents
            var recentDocs = await _context.Documents
                .Include(d => d.Case)
                .ThenInclude(c => c!.Client)
                .ThenInclude(c => c.User)
                .OrderByDescending(d => d.CreatedAt)
                .Take(3)
                .ToListAsync();

            foreach (var doc in recentDocs)
            {
                var clientName = doc.Case?.Client?.CompanyName ?? "Unknown";
                var actorName = doc.Case?.Client?.User?.FirstName + " " + doc.Case?.Client?.User?.LastName ?? "System";
                
                activities.Add(new ActivityDto(
                    doc.Id,
                    "document",
                    $"{clientName} uploaded {doc.FileName}",
                    doc.CreatedAt,
                    actorName
                ));
            }

            // Get recent case updates
            var recentCases = await _context.Cases
                .Include(c => c.Client)
                .ThenInclude(c => c.User)
                .OrderByDescending(c => c.UpdatedAt ?? c.CreatedAt)
                .Take(3)
                .ToListAsync();

            foreach (var caseItem in recentCases)
            {
                activities.Add(new ActivityDto(
                    caseItem.Id,
                    "case",
                    $"Case '{caseItem.Title}' for {caseItem.Client.CompanyName} updated",
                    caseItem.UpdatedAt ?? caseItem.CreatedAt,
                    "System"
                ));
            }

            // Get recent messages
            var recentMessages = await _context.Messages
                .Include(m => m.SenderUser)
                .OrderByDescending(m => m.CreatedAt)
                .Take(2)
                .ToListAsync();

            foreach (var msg in recentMessages)
            {
                activities.Add(new ActivityDto(
                    msg.Id,
                    "message",
                    $"New message from {msg.SenderUser.FirstName} {msg.SenderUser.LastName}",
                    msg.CreatedAt,
                    msg.SenderUser.FirstName + " " + msg.SenderUser.LastName
                ));
            }

            // Sort by timestamp and take top 7
            var sortedActivities = activities
                .OrderByDescending(a => a.Timestamp)
                .Take(7)
                .ToList();

            return Ok(sortedActivities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching dashboard activities");
            return StatusCode(500, new { message = "Error fetching activities data" });
        }
    }
}
