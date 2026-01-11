namespace NFK.Application.DTOs.Messages;

public record MessageDto(
    int Id,
    string Sender,
    string Subject,
    string Preview,
    string Body,
    DateTime Timestamp,
    bool Unread
);

public record MarkMessageReadRequest(
    int MessageId
);
