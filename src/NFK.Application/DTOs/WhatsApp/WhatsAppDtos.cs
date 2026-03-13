namespace NFK.Application.DTOs.WhatsApp;

// Webhook payload from Meta
public class WhatsAppWebhookPayload
{
    public string Object { get; set; } = string.Empty;
    public List<WhatsAppEntry> Entry { get; set; } = new();
}

public class WhatsAppEntry
{
    public string Id { get; set; } = string.Empty;
    public List<WhatsAppChange> Changes { get; set; } = new();
}

public class WhatsAppChange
{
    public WhatsAppValue Value { get; set; } = new();
    public string Field { get; set; } = string.Empty;
}

public class WhatsAppValue
{
    public string MessagingProduct { get; set; } = string.Empty;
    public WhatsAppMetadata? Metadata { get; set; }
    public List<WhatsAppContact>? Contacts { get; set; }
    public List<WhatsAppMessage>? Messages { get; set; }
    public List<WhatsAppStatus>? Statuses { get; set; }
}

public class WhatsAppMetadata
{
    public string DisplayPhoneNumber { get; set; } = string.Empty;
    public string PhoneNumberId { get; set; } = string.Empty;
}

public class WhatsAppContact
{
    public WhatsAppProfile? Profile { get; set; }
    public string WaId { get; set; } = string.Empty;
}

public class WhatsAppProfile
{
    public string Name { get; set; } = string.Empty;
}

public class WhatsAppMessage
{
    public string From { get; set; } = string.Empty;
    public string Id { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // text, image, document, audio, video
    public WhatsAppTextContent? Text { get; set; }
    public WhatsAppMediaContent? Image { get; set; }
    public WhatsAppMediaContent? Document { get; set; }
    public WhatsAppMediaContent? Audio { get; set; }
    public WhatsAppMediaContent? Video { get; set; }
}

public class WhatsAppTextContent
{
    public string Body { get; set; } = string.Empty;
}

public class WhatsAppMediaContent
{
    public string Id { get; set; } = string.Empty;
    public string? MimeType { get; set; }
    public string? Sha256 { get; set; }
    public string? Caption { get; set; }
    public string? Filename { get; set; }
}

public class WhatsAppStatus
{
    public string Id { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public string RecipientId { get; set; } = string.Empty;
}

// Send request from staff
public record SendWhatsAppRequest(int RecipientUserId, string Content);
