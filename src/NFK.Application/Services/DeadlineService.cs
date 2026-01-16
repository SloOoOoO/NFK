using NFK.Domain.Entities.Clients;
using NFK.Domain.Entities.Deadlines;
using NFK.Domain.Enums;

namespace NFK.Application.Services;

public class DeadlineService
{
    public List<Deadline> CalculateDeadlines(Client client, int year)
    {
        var deadlines = new List<Deadline>();
        
        // Example: If client has monthly VAT (this would be based on client configuration)
        // For demo purposes, we'll generate monthly VAT deadlines
        for (int month = 1; month <= 12; month++)
        {
            // VAT deadline is 10th of each month
            var hardDeadline = new DateTime(year, month, 10, 23, 59, 59);
            var softDeadline = hardDeadline.AddDays(-5); // 5 days before
            
            deadlines.Add(new Deadline
            {
                ClientId = client.Id,
                Type = "UStVA",
                HardDeadline = hardDeadline,
                SoftDeadline = softDeadline,
                IsRecurring = true,
                RecurrencePattern = "Monthly",
                Status = DeadlineStatus.Pending,
                CreatedAt = DateTime.UtcNow
            });
        }
        
        // Quarterly reports (end of each quarter + 1 month)
        for (int quarter = 1; quarter <= 4; quarter++)
        {
            var quarterEndMonth = quarter * 3;
            var hardDeadline = new DateTime(year, quarterEndMonth, DateTime.DaysInMonth(year, quarterEndMonth), 23, 59, 59)
                .AddMonths(1); // Due one month after quarter end
            var softDeadline = hardDeadline.AddDays(-7);
            
            deadlines.Add(new Deadline
            {
                ClientId = client.Id,
                Type = "Quarterly Report",
                HardDeadline = hardDeadline,
                SoftDeadline = softDeadline,
                IsRecurring = true,
                RecurrencePattern = "Quarterly",
                Status = DeadlineStatus.Pending,
                CreatedAt = DateTime.UtcNow
            });
        }
        
        // Annual tax return (July 31st of following year)
        var annualDeadline = new DateTime(year + 1, 7, 31, 23, 59, 59);
        deadlines.Add(new Deadline
        {
            ClientId = client.Id,
            Type = "Annual Tax Return",
            HardDeadline = annualDeadline,
            SoftDeadline = annualDeadline.AddDays(-14),
            IsRecurring = true,
            RecurrencePattern = "Yearly",
            Status = DeadlineStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        
        return deadlines;
    }
    
    public string CalculateDayLoad(int deadlineCount)
    {
        if (deadlineCount > 5) return "high";  // Red
        if (deadlineCount >= 3) return "medium"; // Orange
        return "low"; // Green
    }
}
