namespace Videogames.Domain.Ports;

public interface IStoragePort
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);
    Task<string> GetUploadFileUrlAsync(string fileName, string contentType, DateTime expiresAtUtc);
    Task<Stream> GetFileAsync(string fileName);
    Task<string> GetFileUrlAsync(string fileName);
}
