using NFK.Domain.Common;

namespace NFK.Domain.Entities.Audit;

public class LoginAttempt : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public bool IsSuccessful { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? FailureReason { get; set; }
}
