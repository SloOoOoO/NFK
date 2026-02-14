using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NFK.Application.Interfaces;
using System.Net;
using System.Net.Mail;

namespace NFK.Application.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly string _fromEmail;
    private readonly string _fromName;
    private readonly string _frontendUrl;

    public EmailService(
        IConfiguration configuration,
        ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _fromEmail = configuration["Email:Smtp:FromEmail"] ?? "info@nfk-buchhaltung.de";
        _fromName = configuration["Email:Smtp:FromName"] ?? "NFK Buchhaltung";
        _frontendUrl = configuration["Frontend:Url"] ?? "http://localhost:5173";
    }

    public async Task SendEmailVerificationAsync(string email, string firstName, string verificationToken)
    {
        var verificationLink = $"{_frontendUrl}/auth/verify-email?token={verificationToken}";
        var subject = "Bestätigen Sie Ihre E-Mail-Adresse - NFK Buchhaltung";
        var body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #1e40af; color: white; padding: 20px; text-align: center; }}
        .content {{ background-color: #f9fafb; padding: 30px; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>NFK Buchhaltung</h1>
        </div>
        <div class=""content"">
            <h2>Willkommen, {firstName}!</h2>
            <p>Vielen Dank für Ihre Registrierung bei NFK Buchhaltung.</p>
            <p>Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren:</p>
            <p style=""text-align: center;"">
                <a href=""{verificationLink}"" class=""button"">E-Mail-Adresse bestätigen</a>
            </p>
            <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
            <p style=""word-break: break-all; color: #6b7280;"">{verificationLink}</p>
            <p><strong>Hinweis:</strong> Dieser Link ist 24 Stunden gültig.</p>
        </div>
        <div class=""footer"">
            <p>© 2026 NFK Buchhaltung. Alle Rechte vorbehalten.</p>
            <p>info@nfk-buchhaltung.de</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendPasswordResetEmailAsync(string email, string firstName, string resetToken)
    {
        var resetLink = $"{_frontendUrl}/auth/reset-password?token={resetToken}";
        var subject = "Passwort zurücksetzen - NFK Buchhaltung";
        var body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #1e40af; color: white; padding: 20px; text-align: center; }}
        .content {{ background-color: #f9fafb; padding: 30px; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>NFK Buchhaltung</h1>
        </div>
        <div class=""content"">
            <h2>Passwort zurücksetzen</h2>
            <p>Hallo {firstName},</p>
            <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
            <p>Klicken Sie auf den folgenden Button, um Ihr Passwort zurückzusetzen:</p>
            <p style=""text-align: center;"">
                <a href=""{resetLink}"" class=""button"">Passwort zurücksetzen</a>
            </p>
            <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
            <p style=""word-break: break-all; color: #6b7280;"">{resetLink}</p>
            <p><strong>Hinweis:</strong> Dieser Link ist 1 Stunde gültig.</p>
            <p>Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
        </div>
        <div class=""footer"">
            <p>© 2026 NFK Buchhaltung. Alle Rechte vorbehalten.</p>
            <p>info@nfk-buchhaltung.de</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendEmailNotFoundNotificationAsync(string email)
    {
        var subject = "Passwort-Anfrage - NFK Buchhaltung";
        var body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #1e40af; color: white; padding: 20px; text-align: center; }}
        .content {{ background-color: #f9fafb; padding: 30px; }}
        .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>NFK Buchhaltung</h1>
        </div>
        <div class=""content"">
            <h2>Passwort-Anfrage</h2>
            <p>Hallo,</p>
            <p>Sie haben eine Anfrage zum Zurücksetzen des Passworts für diese E-Mail-Adresse gestellt.</p>
            <p><strong>Diese E-Mail-Adresse ist nicht in unserer Datenbank registriert.</strong></p>
            <p>Wenn Sie ein Konto bei NFK Buchhaltung erstellen möchten, registrieren Sie sich bitte auf unserer Website:</p>
            <p style=""text-align: center;"">
                <a href=""{_frontendUrl}/auth/register"" style=""display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;"">Jetzt registrieren</a>
            </p>
        </div>
        <div class=""footer"">
            <p>© 2026 NFK Buchhaltung. Alle Rechte vorbehalten.</p>
            <p>info@nfk-buchhaltung.de</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendWelcomeEmailAsync(string email, string firstName)
    {
        var subject = "Willkommen bei NFK Buchhaltung!";
        var body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #1e40af; color: white; padding: 20px; text-align: center; }}
        .content {{ background-color: #f9fafb; padding: 30px; }}
        .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>NFK Buchhaltung</h1>
        </div>
        <div class=""content"">
            <h2>Willkommen, {firstName}!</h2>
            <p>Ihre E-Mail-Adresse wurde erfolgreich bestätigt.</p>
            <p>Sie können sich jetzt bei Ihrem Konto anmelden und alle Funktionen nutzen.</p>
            <p style=""text-align: center;"">
                <a href=""{_frontendUrl}/auth/login"" style=""display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;"">Jetzt anmelden</a>
            </p>
        </div>
        <div class=""footer"">
            <p>© 2026 NFK Buchhaltung. Alle Rechte vorbehalten.</p>
            <p>info@nfk-buchhaltung.de</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(email, subject, body);
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            var provider = _configuration["Email:Provider"] ?? "Smtp";
            
            if (provider.Equals("SendGrid", StringComparison.OrdinalIgnoreCase))
            {
                await SendViaSendGridAsync(toEmail, subject, htmlBody);
            }
            else
            {
                await SendViaSmtpAsync(toEmail, subject, htmlBody);
            }

            _logger.LogInformation("Email sent successfully to {Email}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}: {Subject}", toEmail, subject);
            throw;
        }
    }

    private async Task SendViaSmtpAsync(string toEmail, string subject, string htmlBody)
    {
        var smtpHost = _configuration["Email:Smtp:Host"];
        var smtpPort = int.Parse(_configuration["Email:Smtp:Port"] ?? "587");
        var smtpUsername = _configuration["Email:Smtp:Username"];
        var smtpPassword = _configuration["Email:Smtp:Password"];
        var enableSsl = bool.Parse(_configuration["Email:Smtp:EnableSsl"] ?? "true");

        if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword))
        {
            _logger.LogWarning("SMTP configuration is incomplete. Email not sent to {Email}", toEmail);
            _logger.LogInformation("Email would have been sent: To={Email}, Subject={Subject}", toEmail, subject);
            return;
        }

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            EnableSsl = enableSsl,
            Credentials = new NetworkCredential(smtpUsername, smtpPassword)
        };

        var message = new MailMessage
        {
            From = new MailAddress(_fromEmail, _fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        message.To.Add(toEmail);

        await client.SendMailAsync(message);
    }

    private async Task SendViaSendGridAsync(string toEmail, string subject, string htmlBody)
    {
        var apiKey = _configuration["Email:SendGrid:ApiKey"];
        
        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("SendGrid API key is not configured. Email not sent to {Email}", toEmail);
            _logger.LogInformation("Email would have been sent: To={Email}, Subject={Subject}", toEmail, subject);
            return;
        }

        // TODO: Implement SendGrid integration
        // For now, fall back to SMTP
        _logger.LogInformation("SendGrid integration not yet implemented, falling back to SMTP");
        await SendViaSmtpAsync(toEmail, subject, htmlBody);
    }
}
