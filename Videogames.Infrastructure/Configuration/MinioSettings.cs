namespace Videogames.Infrastructure.Configuration;

public class MinioSettings
{
    public const string SectionName = "Minio";
    public string Endpoint { get; set; } = "http://localhost:9000";
    public string User { get; set; } = "minioadmin";
    public string Secret { get; set; } = "minioadmin";
    public string BucketName { get; set; } = "videogames";
    public string Region { get; set; } = "us-east-1";
    public bool UseSSL { get; set; }
}
