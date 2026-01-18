using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NFK.Infrastructure.Data;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Roles = "SuperAdmin,DATEVManager")]
public class AnalyticsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(ApplicationDbContext context, ILogger<AnalyticsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("page-visits")]
    public async Task<IActionResult> GetPageVisits()
    {
        try
        {
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var twelveMonthsAgo = DateTime.UtcNow.AddMonths(-12);

            var dailyVisits = await _context.PageVisits
                .Where(pv => pv.CreatedAt >= thirtyDaysAgo)
                .GroupBy(pv => pv.CreatedAt.Date)
                .Select(g => new { date = g.Key, count = g.Count() })
                .OrderBy(x => x.date)
                .ToListAsync();

            // Fix: Execute query first, then format strings in C# (not SQL)
            var monthlyData = await _context.PageVisits
                .Where(pv => pv.CreatedAt >= twelveMonthsAgo)
                .GroupBy(pv => new { pv.CreatedAt.Year, pv.CreatedAt.Month })
                .Select(g => new { 
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Count = g.Count() 
                })
                .ToListAsync();

            var monthlyVisits = monthlyData
                .Select(x => new
                {
                    month = $"{x.Year}-{x.Month:D2}",
                    count = x.Count
                })
                .OrderBy(x => x.month)
                .ToList();

            var totalThisYear = await _context.PageVisits
                .Where(pv => pv.CreatedAt.Year == DateTime.UtcNow.Year)
                .CountAsync();

            return Ok(new
            {
                daily = dailyVisits,
                monthly = monthlyVisits,
                totalThisYear
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching analytics");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching analytics" });
        }
    }
}
