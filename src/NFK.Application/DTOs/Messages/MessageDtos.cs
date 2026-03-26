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
    bool IsSent = false,
    bool AssistantVisible = false
);

public record MarkMessageReadRequest(
    int MessageId
);

public record SendMessageRequest(
    int RecipientUserId,
    string Subject,
    string Content,
    int? CaseId = null,
    bool AssistantVisible = false
);

public record ReplyMessageRequest(
    string Content,
    bool? AssistantVisible = null
);

public record ConversationDto(
    int? OtherUserId,
    string OtherUserName,
    string LastMessagePreview,
    DateTime LastMessageTime,
    int UnreadCount,
    bool IsPoolEmail,
    bool LastMessageAssistantVisible,
    string? ViaConsultantName = null,
    bool IsReadOnly = false
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
    bool AssistantVisible
);
