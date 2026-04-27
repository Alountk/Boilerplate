using System.ComponentModel.DataAnnotations;

namespace Videogames.Application.DTOs;

public record CreatePresignedUploadRequestDto(
    [Required(ErrorMessage = "ContentType is required")]
    string ContentType,
    [Range(1, long.MaxValue, ErrorMessage = "SizeBytes must be greater than 0")]
    long SizeBytes
);

public record PresignedUploadDto(
    string FileName,
    string UploadUrl,
    DateTime ExpiresAtUtc
);