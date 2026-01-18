using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace NFK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class AnalyticsController : ControllerBase
{
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(ILogger<AnalyticsController> logger)
    {
        _logger = logger;
    }

    [HttpGet("page-visits")]
    public IActionResult GetPageVisits()
    {
        try
        {
            // Mock analytics data for now
            // In a real implementation, this would fetch from database or analytics service
            
            // Generate daily data for last 30 days
            var dailyData = Enumerable.Range(0, 30)
                .Select(i => new
                {
                    date = DateTime.Now.AddDays(-29 + i).ToString("dd.MM.yyyy"),
                    visits = new Random(i).Next(50, 200)
                })
                .ToList();

            // Generate monthly data for last 12 months
            var monthlyData = Enumerable.Range(0, 12)
                .Select(i =>
                {
                    var date = DateTime.Now.AddMonths(-11 + i);
                    return new
                    {
                        month = date.ToString("MMM yyyy"),
                        visits = new Random(i * 100).Next(800, 2500)
                    };
                })
                .ToList();

            // Yearly total
            var yearlyData = new[]
            {
                new
                {
                    year = DateTime.Now.Year,
                    visits = monthlyData.Sum(m => m.visits)
                }
            };

            return Ok(new
            {
                daily = dailyData,
                monthly = monthlyData,
                yearly = yearlyData
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching analytics");
            return StatusCode(500, new { error = "internal_error", message = "Error fetching analytics" });
        }
    }
}
