using Videogames.Application.DTOs;
using Videogames.Domain.Ports;

namespace Videogames.Application.Services;

public class ImageService : IImageService
{
    private const long MaxUploadSizeBytes = 5 * 1024 * 1024;
    private static readonly Dictionary<string, string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/gif"] = ".gif",
        ["image/webp"] = ".webp"
    };

    private readonly IStoragePort _storagePort;

    public ImageService(IStoragePort storagePort)
    {
        _storagePort = storagePort;
    }

    public async Task<string> UploadImageAsync(Stream fileStream, string contentType)
    {
        if (fileStream == null)
        {
            throw new ArgumentException("File stream is required.");
        }

        var fileName = $"{Guid.NewGuid()}{GetExtension(contentType)}";
        return await _storagePort.UploadFileAsync(fileStream, fileName, contentType);
    }

    public async Task<PresignedUploadDto> CreatePresignedUploadAsync(string contentType, long sizeBytes)
    {
        if (sizeBytes <= 0)
        {
            throw new ArgumentException("SizeBytes must be greater than 0.");
        }

        if (sizeBytes > MaxUploadSizeBytes)
        {
            throw new ArgumentException($"File size exceeds allowed limit of {MaxUploadSizeBytes} bytes.");
        }

        var extension = GetExtension(contentType);
        var fileName = $"{Guid.NewGuid()}{extension}";
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(15);
        var uploadUrl = await _storagePort.GetUploadFileUrlAsync(fileName, contentType, expiresAtUtc);

        return new PresignedUploadDto(fileName, uploadUrl, expiresAtUtc);
    }

    public async Task<Stream> GetImageAsync(string fileName)
    {
        return await _storagePort.GetFileAsync(fileName);
    }

    public async Task<string> GetImageUrlAsync(string fileName)
    {
        return await _storagePort.GetFileUrlAsync(fileName);
    }

    private string GetExtension(string contentType)
    {
        if (string.IsNullOrWhiteSpace(contentType))
        {
            throw new ArgumentException("ContentType is required.");
        }

        if (AllowedExtensions.TryGetValue(contentType, out var extension))
        {
            return extension;
        }

        throw new ArgumentException($"Unsupported image content type: {contentType}");
    }
}
