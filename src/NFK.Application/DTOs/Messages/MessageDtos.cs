namespace NFK.Application.DTOs.Messages;

public record MessageDto(
    int Id,
    string Sender,
    string Subject,
    string Preview,
    string Body,
    DateTime Timestamp,
    bool Unread,
    bool IsPoolEmail = false
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
