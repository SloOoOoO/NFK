namespace NFK.Application.DTOs.Messages;

public record MessageDto(
    int Id,
    string Sender,
    string Subject,
    string Preview,
    string Body,
    DateTime Timestamp,
    bool Unread,
    bool IsPoolEmail = false,
    string? Recipient = null,
    bool IsSent = false
);

public record MarkMessageReadRequest(
    int MessageId
);

public record SendMessageRequest(
    int RecipientUserId,
    string Subject,
    string Content,
    int? CaseId = null
);

public record ReplyMessageRequest(
    string Content
);

public record ConversationDto(
    int? OtherUserId,
    string OtherUserName,
    string LastMessagePreview,
    DateTime LastMessageTime,
    int UnreadCount,
    bool IsPoolEmail,
    bool IsWhatsApp = false
);

public record ConversationMessageDto(
    int Id,
    int? SenderId,
    string SenderName,
    string Content,
    string Subject,
    DateTime Timestamp,
    bool IsRead,
    bool IsMine,
    bool IsWhatsApp = false
);
