namespace NFK.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailVerificationAsync(string email, string firstName, string verificationToken);
    Task SendPasswordResetEmailAsync(string email, string firstName, string resetToken);
    Task SendEmailNotFoundNotificationAsync(string email);
    Task SendWelcomeEmailAsync(string email, string firstName);
    Task SendContactFormEmailAsync(string toEmail, string senderName, string senderEmail, string subject, string message);
    Task SendAppointmentNotificationAsync(string toEmail, string firstName, string title, DateTime startTime, DateTime endTime, string? description, string? location);
    Task SendContactConfirmationAsync(string toEmail, string senderName);
}
