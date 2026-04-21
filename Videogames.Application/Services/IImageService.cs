using Videogames.Application.DTOs;

namespace Videogames.Application.Services;

public interface IImageService
{
    Task<string> UploadImageAsync(Stream fileStream, string contentType);
    Task<PresignedUploadDto> CreatePresignedUploadAsync(string contentType, long sizeBytes);
    Task<Stream> GetImageAsync(string fileName);
    Task<string> GetImageUrlAsync(string fileName);
}
