namespace NFK.Application.DTOs.Documents;

public record DocumentDto(
    int Id,
    string Name,
    string FileName,
    long Size,
    int? ClientId,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record UploadDocumentResponse(
    int Id,
    string FileName,
    long Size,
    string Message
);
