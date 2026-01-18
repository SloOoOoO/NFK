using System.Text.RegularExpressions;

namespace NFK.Infrastructure.Security;

public class PasswordPolicy
{
    public const int MinimumLength = 12;
    public const int PasswordHistoryCount = 5;
    public const int PasswordExpirationDays = 90;
    
    public static PasswordValidationResult Validate(string password)
    {
        var errors = new List<string>();
        
        if (password.Length < MinimumLength)
        {
            errors.Add($"Password must be at least {MinimumLength} characters long");
        }
        
        if (!Regex.IsMatch(password, @"[A-Z]"))
        {
            errors.Add("Password must contain at least one uppercase letter");
        }
        
        if (!Regex.IsMatch(password, @"[a-z]"))
        {
            errors.Add("Password must contain at least one lowercase letter");
        }
        
        if (!Regex.IsMatch(password, @"\d"))
        {
            errors.Add("Password must contain at least one number");
        }
        
        if (!Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>/?]"))
        {
            errors.Add("Password must contain at least one special character");
        }
        
        return new PasswordValidationResult
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }
    
    public static bool IsPasswordInHistory(string newPasswordHash, HashSet<string> passwordHistory)
    {
        return passwordHistory.Contains(newPasswordHash);
    }
}

public class PasswordValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
}
