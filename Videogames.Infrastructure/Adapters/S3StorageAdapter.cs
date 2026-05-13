using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Options;
using Videogames.Domain.Ports;
using Videogames.Infrastructure.Configuration;

namespace Videogames.Infrastructure.Adapters;

public class S3StorageAdapter : IStoragePort
{
    private readonly MinioSettings _settings;
    private readonly IAmazonS3 _s3Client;

    public S3StorageAdapter(IOptions<MinioSettings> settings)
    {
        _settings = settings.Value;
        var endpoint = string.IsNullOrWhiteSpace(_settings.Endpoint)
            ? "http://localhost:9000"
            : _settings.Endpoint;

        if (!endpoint.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
            !endpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            endpoint = $"http://{endpoint}";
        }

        var config = new AmazonS3Config
        {
            ServiceURL = endpoint,
            AuthenticationRegion = string.IsNullOrWhiteSpace(_settings.Region)
                ? "us-east-1"
                : _settings.Region,
            ForcePathStyle = true, // Required for MinIO and other S3-compatible providers
            UseHttp = !_settings.UseSSL,
        };

        _s3Client = new AmazonS3Client(_settings.User, _settings.Secret, config);
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        var fileTransferUtility = new TransferUtility(_s3Client);

        var uploadRequest = new TransferUtilityUploadRequest
        {
            InputStream = fileStream,
            Key = fileName,
            BucketName = _settings.BucketName,
            ContentType = contentType
        };

        await fileTransferUtility.UploadAsync(uploadRequest);

        // Return the storage key so application and API stay provider-agnostic.
        return fileName;
    }

    public Task<string> GetUploadFileUrlAsync(string fileName, string contentType, DateTime expiresAtUtc)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _settings.BucketName,
            Key = fileName,
            Verb = HttpVerb.PUT,
            ContentType = contentType,
            Expires = expiresAtUtc
        };

        return Task.FromResult(_s3Client.GetPreSignedURL(request));
    }

    public async Task<Stream> GetFileAsync(string fileName)
    {
        var request = new Amazon.S3.Model.GetObjectRequest
        {
            BucketName = _settings.BucketName,
            Key = fileName
        };

        var response = await _s3Client.GetObjectAsync(request);
        return response.ResponseStream;
    }

    public Task<string> GetFileUrlAsync(string fileName)
    {
        return GetFileUrlAsync(fileName, DateTime.UtcNow.AddHours(1));
    }

    public Task<string> GetFileUrlAsync(string fileName, DateTime expiresAtUtc)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _settings.BucketName,
            Key = fileName,
            Expires = expiresAtUtc
        };

        return Task.FromResult(_s3Client.GetPreSignedURL(request));
    }
}