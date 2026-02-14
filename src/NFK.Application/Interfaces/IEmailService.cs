namespace NFK.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailVerificationAsync(string email, string firstName, string verificationToken);
    Task SendPasswordResetEmailAsync(string email, string firstName, string resetToken);
    Task SendEmailNotFoundNotificationAsync(string email);
    Task SendWelcomeEmailAsync(string email, string firstName);
}
