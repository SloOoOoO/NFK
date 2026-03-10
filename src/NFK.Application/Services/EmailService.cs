using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using NFK.Application.Interfaces;

namespace NFK.Application.Services;

public class EmailService : IEmailService
{
    private const int SmtpTimeoutSeconds = 30;

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
        _fromEmail = Environment.GetEnvironmentVariable("SMTP_FROM") ?? string.Empty;
        _fromName = configuration["Email:Smtp:FromName"] ?? "NFK Buchhaltung";
        _frontendUrl = configuration["Frontend:Url"] ?? "http://localhost:5173";
    }

    public async Task SendEmailVerificationAsync(string email, string firstName, string verificationToken)
    {
        var verificationLink = $"{_frontendUrl}/auth/verify-email?token={Uri.EscapeDataString(verificationToken)}";
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
            <p>{_fromEmail}</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendPasswordResetEmailAsync(string email, string firstName, string resetToken)
    {
        var resetLink = $"{_frontendUrl}/auth/reset-password?token={Uri.EscapeDataString(resetToken)}";
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
            <p>{_fromEmail}</p>
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
            <p>{_fromEmail}</p>
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
            <p>{_fromEmail}</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendContactFormEmailAsync(string toEmail, string senderName, string senderEmail, string subject, string message)
    {
        var emailSubject = $"[Kontaktformular] {subject}";
        var body = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"" />
    <style>
        body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }}
        .header {{ background-color: #208A8F; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px; }}
        .field-label {{ font-weight: bold; color: #555; margin-top: 16px; }}
        .field-value {{ color: #333; margin-top: 4px; }}
        .message-box {{ background: #f8f9fa; border-left: 4px solid #208A8F; padding: 16px; margin-top: 8px; white-space: pre-wrap; }}
        .footer {{ margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h2 style=""margin:0;"">Neue Kontaktanfrage</h2>
        </div>
        <p>Eine neue Nachricht wurde über das Kontaktformular auf der NFK-Website gesendet.</p>
        <div class=""field-label"">Name:</div>
        <div class=""field-value"">{System.Net.WebUtility.HtmlEncode(senderName)}</div>
        <div class=""field-label"">E-Mail:</div>
        <div class=""field-value""><a href=""mailto:{System.Net.WebUtility.HtmlEncode(senderEmail)}"">{System.Net.WebUtility.HtmlEncode(senderEmail)}</a></div>
        <div class=""field-label"">Betreff:</div>
        <div class=""field-value"">{System.Net.WebUtility.HtmlEncode(subject)}</div>
        <div class=""field-label"">Nachricht:</div>
        <div class=""message-box"">{System.Net.WebUtility.HtmlEncode(message)}</div>
        <div class=""footer"">
            <p>Diese E-Mail wurde automatisch vom NFK Kontaktformular generiert.</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, emailSubject, body);
    }

    public async Task SendAccountDeletionEmailAsync(string email, string firstName)
    {
        var subject = "Ihr Konto bei NFK Buchhaltung wurde gelöscht";
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
            <h2>Konto gelöscht</h2>
            <p>Hallo {System.Net.WebUtility.HtmlEncode(firstName)},</p>
            <p>wir möchten Sie darüber informieren, dass Ihr Konto bei NFK Buchhaltung erfolgreich gelöscht wurde.</p>
            <p>Im Zuge der Kontolöschung wurden alle mit Ihrem Konto verknüpften Daten entfernt, darunter Ihre persönlichen Informationen, Dokumente und Termine.</p>
            <p>Sollten Sie in Zukunft erneut unsere Dienste in Anspruch nehmen möchten, können Sie sich jederzeit mit dieser E-Mail-Adresse neu registrieren.</p>
            <p>Wir danken Ihnen für Ihr Vertrauen und wünschen Ihnen alles Gute.</p>
            <p>Mit freundlichen Grüßen,<br>Ihr NFK Buchhaltung Team</p>
        </div>
        <div class=""footer"">
            <p>© 2026 NFK Buchhaltung. Alle Rechte vorbehalten.</p>
            <p>{_fromEmail}</p>
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
        var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST");
        var smtpPortValue = Environment.GetEnvironmentVariable("SMTP_PORT");
        var smtpUsername = Environment.GetEnvironmentVariable("SMTP_USERNAME");
        var smtpPassword = Environment.GetEnvironmentVariable("SMTP_PASSWORD");
        var enableSslValue = Environment.GetEnvironmentVariable("SMTP_ENABLE_SSL");

        if (string.IsNullOrEmpty(smtpHost)
            || string.IsNullOrEmpty(smtpPortValue)
            || string.IsNullOrEmpty(_fromEmail))
        {
            _logger.LogWarning("SMTP configuration is incomplete (missing host, port, or from address). Email not sent to {Email}", toEmail);
            _logger.LogInformation("Email would have been sent: To={Email}, Subject={Subject}", toEmail, subject);
            return;
        }

        if (!int.TryParse(smtpPortValue, out var smtpPort))
        {
            _logger.LogWarning("SMTP_PORT is not a valid integer ({Value}). Email not sent to {Email}", smtpPortValue, toEmail);
            return;
        }

        var enableSsl = false;
        if (!string.IsNullOrWhiteSpace(enableSslValue))
        {
            if (!bool.TryParse(enableSslValue, out enableSsl))
            {
                _logger.LogWarning("SMTP_ENABLE_SSL value '{Value}' is not a valid boolean. Defaulting SSL to disabled", enableSslValue);
                enableSsl = false;
            }
        }

        // Determine the correct TLS option to avoid protocol mismatches:
        //   port 465 (or SMTP_ENABLE_SSL=true + 465)  → SSL on connect
        //   port 587                                    → STARTTLS
        //   anything else (e.g. 1025 for Mailpit)      → plaintext
        SecureSocketOptions socketOptions;
        if (enableSsl && smtpPort == 465)
        {
            socketOptions = SecureSocketOptions.SslOnConnect;
        }
        else if (smtpPort == 587)
        {
            socketOptions = SecureSocketOptions.StartTls;
        }
        else
        {
            socketOptions = SecureSocketOptions.None;
        }

        var hasCredentials = !string.IsNullOrEmpty(smtpUsername) && !string.IsNullOrEmpty(smtpPassword);

        _logger.LogDebug("SMTP connecting to {Host}:{Port} mode={Mode} auth={Auth}",
            smtpHost, smtpPort, socketOptions, hasCredentials ? "yes" : "no");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_fromName, _fromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart(MimeKit.Text.TextFormat.Html) { Text = htmlBody };

        using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(SmtpTimeoutSeconds));
        using var client = new SmtpClient();

        try
        {
            await client.ConnectAsync(smtpHost, smtpPort, socketOptions, cts.Token);

            // Only authenticate when credentials are provided (not needed for Mailpit / local catchers)
            if (hasCredentials)
            {
                await client.AuthenticateAsync(smtpUsername, smtpPassword, cts.Token);
            }

            await client.SendAsync(message, cts.Token);
            await client.DisconnectAsync(true, cts.Token);
        }
        catch (MailKit.Security.AuthenticationException ex)
        {
            _logger.LogError("SMTP authentication failed for {Host}:{Port} (user={User}): {Message}",
                smtpHost, smtpPort, smtpUsername, ex.Message);
            throw;
        }
        catch (MailKit.Net.Smtp.SmtpCommandException ex)
        {
            _logger.LogError("SMTP protocol error sending to {Recipient} via {Host}:{Port} – status={Status} message={Message}",
                toEmail, smtpHost, smtpPort, ex.StatusCode, ex.Message);
            throw;
        }
        catch (MailKit.Net.Smtp.SmtpProtocolException ex)
        {
            _logger.LogError("SMTP protocol exception sending to {Recipient} via {Host}:{Port}: {Message}",
                toEmail, smtpHost, smtpPort, ex.Message);
            throw;
        }
        catch (System.Net.Sockets.SocketException ex)
        {
            _logger.LogError("SMTP DNS/connect error for {Host}:{Port}: {Message}", smtpHost, smtpPort, ex.Message);
            throw;
        }
        catch (OperationCanceledException)
        {
            _logger.LogError("SMTP send timed out after {Timeout} s for {Host}:{Port} recipient={Recipient}", SmtpTimeoutSeconds, smtpHost, smtpPort, toEmail);
            throw;
        }
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

    public async Task SendAppointmentNotificationAsync(string toEmail, string firstName, string title, DateTime startTime, DateTime endTime, string? description, string? location)
    {
        var subject = $"Neuer Termin: {title}";
        var startFormatted = startTime.ToString("dd.MM.yyyy HH:mm");
        var endFormatted = endTime.ToString("dd.MM.yyyy HH:mm");
        var descriptionHtml = !string.IsNullOrWhiteSpace(description)
            ? $"<div class=\"field-label\">Beschreibung:</div><div class=\"field-value\">{System.Net.WebUtility.HtmlEncode(description)}</div>"
            : string.Empty;
        var locationHtml = !string.IsNullOrWhiteSpace(location)
            ? $"<div class=\"field-label\">Ort:</div><div class=\"field-value\">{System.Net.WebUtility.HtmlEncode(location)}</div>"
            : string.Empty;

        var body = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"" />
    <style>
        body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }}
        .header {{ background-color: #208A8F; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px; }}
        .field-label {{ font-weight: bold; color: #555; margin-top: 16px; }}
        .field-value {{ color: #333; margin-top: 4px; }}
        .footer {{ margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h2 style=""margin:0;"">Neuer Termin</h2>
        </div>
        <p>Hallo {System.Net.WebUtility.HtmlEncode(firstName)},</p>
        <p>Für Sie wurde ein neuer Termin vereinbart.</p>
        <div class=""field-label"">Titel:</div>
        <div class=""field-value"">{System.Net.WebUtility.HtmlEncode(title)}</div>
        <div class=""field-label"">Beginn:</div>
        <div class=""field-value"">{startFormatted} Uhr</div>
        <div class=""field-label"">Ende:</div>
        <div class=""field-value"">{endFormatted} Uhr</div>
        {locationHtml}
        {descriptionHtml}
        <div class=""footer"">
            <p>Diese E-Mail wurde automatisch vom NFK Steuerberatungsportal generiert.</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, body);
    }

    public async Task SendContactConfirmationAsync(string toEmail, string senderName)
    {
        var subject = "Ihre Nachricht ist bei uns eingegangen – NFK Buchhaltung";
        var body = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"" />
    <style>
        body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }}
        .header {{ background-color: #208A8F; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px; }}
        .footer {{ margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h2 style=""margin:0;"">Ihre Nachricht wurde empfangen</h2>
        </div>
        <p>Hallo {System.Net.WebUtility.HtmlEncode(senderName)},</p>
        <p>Vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und werden uns so schnell wie möglich bei Ihnen melden.</p>
        <p>Mit freundlichen Grüßen,<br/>Ihr NFK Buchhaltung Team</p>
        <div class=""footer"">
            <p>Diese E-Mail wurde automatisch vom NFK Steuerberatungsportal generiert.</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, body);
    }
}
