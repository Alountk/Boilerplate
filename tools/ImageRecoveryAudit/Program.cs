using System.Globalization;
using System.Text;
using System.Text.Json;
using Amazon.S3;
using Amazon.S3.Model;
using Npgsql;

var options = AuditOptions.FromEnvironment();
Directory.CreateDirectory(options.OutputDirectory);

Console.WriteLine("[audit] Loading image references from database...");
var referencedRecords = await LoadReferencedImageRecordsAsync(options.ConnectionString);

var externalUrlCount = referencedRecords.Count(r => r.Kind == ReferenceKind.ExternalUrl);
var internalReferences = referencedRecords
    .Where(r => r.Kind == ReferenceKind.InternalKey)
    .Select(r => r.Reference)
    .Distinct(StringComparer.Ordinal)
    .ToHashSet(StringComparer.Ordinal);

Console.WriteLine($"[audit] Internal references: {internalReferences.Count}");
Console.WriteLine($"[audit] External URLs skipped: {externalUrlCount}");

Console.WriteLine("[audit] Listing objects from bucket...");
var bucketObjects = await LoadBucketObjectKeysAsync(options);
Console.WriteLine($"[audit] Objects in bucket: {bucketObjects.Count}");

var healthyReferences = internalReferences.Where(bucketObjects.Contains).ToList();
var missingReferences = internalReferences.Where(reference => !bucketObjects.Contains(reference)).ToList();

var impactedByReference = referencedRecords
    .Where(r => r.Kind == ReferenceKind.InternalKey && missingReferences.Contains(r.Reference))
    .GroupBy(r => r.Reference, StringComparer.Ordinal)
    .ToDictionary(
        group => group.Key,
        group => group
            .Select(r => new ImpactedUsage(r.VideogameId, r.SourceField))
            .Distinct()
            .OrderBy(x => x.VideogameId, StringComparer.Ordinal)
            .ThenBy(x => x.SourceField, StringComparer.Ordinal)
            .ToList(),
        StringComparer.Ordinal);

var report = new AuditReport(
    GeneratedAtUtc: DateTime.UtcNow,
    BucketName: options.BucketName,
    TotalReferencedInternal: internalReferences.Count,
    TotalBucketObjects: bucketObjects.Count,
    HealthyCount: healthyReferences.Count,
    MissingCount: missingReferences.Count,
    ExternalUrlCount: externalUrlCount,
    MissingReferences: missingReferences
        .OrderBy(x => x, StringComparer.Ordinal)
        .Select(reference => new MissingReference(
            Reference: reference,
            Usages: impactedByReference.TryGetValue(reference, out var usages) ? usages : []))
        .ToList());

var jsonPath = Path.Combine(options.OutputDirectory, "image-recovery-audit.json");
await File.WriteAllTextAsync(jsonPath, JsonSerializer.Serialize(report, new JsonSerializerOptions
{
    WriteIndented = true
}));

var csvPath = Path.Combine(options.OutputDirectory, "missing-image-references.csv");
await WriteMissingCsvAsync(csvPath, report.MissingReferences);

Console.WriteLine($"[audit] Missing references: {report.MissingCount}");
Console.WriteLine($"[audit] JSON report: {jsonPath}");
Console.WriteLine($"[audit] CSV report: {csvPath}");

return 0;

static async Task<List<ReferencedImageRecord>> LoadReferencedImageRecordsAsync(string connectionString)
{
    const string sql = """
        SELECT "Id"::text AS videogame_id, 'UrlImg' AS source_field, "UrlImg" AS reference
        FROM "Videogames"
        UNION ALL
        SELECT "Id"::text AS videogame_id, 'Images' AS source_field, unnest("Images") AS reference
        FROM "Videogames"
        UNION ALL
        SELECT "VideogameId"::text AS videogame_id, 'FrontalUrl' AS source_field, "FrontalUrl" AS reference
        FROM "GameContent"
        UNION ALL
        SELECT "VideogameId"::text AS videogame_id, 'BackUrl' AS source_field, "BackUrl" AS reference
        FROM "GameContent"
        UNION ALL
        SELECT "VideogameId"::text AS videogame_id, 'RightSideUrl' AS source_field, "RightSideUrl" AS reference
        FROM "GameContent"
        UNION ALL
        SELECT "VideogameId"::text AS videogame_id, 'LeftSideUrl' AS source_field, "LeftSideUrl" AS reference
        FROM "GameContent"
        UNION ALL
        SELECT "VideogameId"::text AS videogame_id, 'TopSideUrl' AS source_field, "TopSideUrl" AS reference
        FROM "GameContent"
        UNION ALL
        SELECT "VideogameId"::text AS videogame_id, 'BottomSideUrl' AS source_field, "BottomSideUrl" AS reference
        FROM "GameContent";
        """;

    var result = new List<ReferencedImageRecord>();

    await using var connection = new NpgsqlConnection(connectionString);
    await connection.OpenAsync();

    await using var command = new NpgsqlCommand(sql, connection);
    await using var reader = await command.ExecuteReaderAsync();

    while (await reader.ReadAsync())
    {
        var videogameId = reader.GetString(0);
        var sourceField = reader.GetString(1);
        if (reader.IsDBNull(2))
        {
            continue;
        }

        var rawReference = reader.GetString(2);
        var normalized = NormalizeReference(rawReference);
        if (normalized is null)
        {
            continue;
        }

        var normalizedReference = normalized.Value;

        result.Add(new ReferencedImageRecord(
            VideogameId: videogameId,
            SourceField: sourceField,
            Reference: normalizedReference.Value,
            Kind: normalizedReference.Kind));
    }

    return result;
}

static async Task<HashSet<string>> LoadBucketObjectKeysAsync(AuditOptions options)
{
    var endpoint = options.Endpoint;
    if (!endpoint.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
        !endpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
    {
        endpoint = $"http://{endpoint}";
    }

    var config = new AmazonS3Config
    {
        ServiceURL = endpoint,
        AuthenticationRegion = options.Region,
        ForcePathStyle = true,
        UseHttp = !options.UseSsl,
    };

    using var client = new AmazonS3Client(options.User, options.Secret, config);

    var keys = new HashSet<string>(StringComparer.Ordinal);
    string? continuationToken = null;

    do
    {
        var response = await client.ListObjectsV2Async(new ListObjectsV2Request
        {
            BucketName = options.BucketName,
            ContinuationToken = continuationToken,
            MaxKeys = 1000,
        });

        foreach (var s3Object in response.S3Objects)
        {
            keys.Add(s3Object.Key);
        }

        continuationToken = response.IsTruncated ? response.NextContinuationToken : null;
    } while (continuationToken is not null);

    return keys;
}

static async Task WriteMissingCsvAsync(string path, IReadOnlyList<MissingReference> missing)
{
    var sb = new StringBuilder();
    sb.AppendLine("reference,videogame_id,source_field");

    foreach (var missingReference in missing)
    {
        if (missingReference.Usages.Count == 0)
        {
            sb.AppendLine($"{CsvEscape(missingReference.Reference)},,");
            continue;
        }

        foreach (var usage in missingReference.Usages)
        {
            sb.AppendLine(
                string.Create(
                    CultureInfo.InvariantCulture,
                    $"{CsvEscape(missingReference.Reference)},{CsvEscape(usage.VideogameId)},{CsvEscape(usage.SourceField)}"));
        }
    }

    await File.WriteAllTextAsync(path, sb.ToString());
}

static string CsvEscape(string value)
{
    if (!value.Contains(',') && !value.Contains('"') && !value.Contains('\n'))
    {
        return value;
    }

    return $"\"{value.Replace("\"", "\"\"")}\"";
}

static NormalizedReference? NormalizeReference(string raw)
{
    var trimmed = raw.Trim();
    if (string.IsNullOrWhiteSpace(trimmed))
    {
        return null;
    }

    var referenceWithoutQuery = trimmed.Split('?', 2, StringSplitOptions.TrimEntries)[0];
    if (string.IsNullOrWhiteSpace(referenceWithoutQuery))
    {
        return null;
    }

    if (referenceWithoutQuery.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
        referenceWithoutQuery.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
    {
        return new NormalizedReference(referenceWithoutQuery, ReferenceKind.ExternalUrl);
    }

    return new NormalizedReference(referenceWithoutQuery, ReferenceKind.InternalKey);
}

enum ReferenceKind
{
    InternalKey,
    ExternalUrl,
}

readonly record struct NormalizedReference(string Value, ReferenceKind Kind);

readonly record struct ReferencedImageRecord(string VideogameId, string SourceField, string Reference, ReferenceKind Kind);

readonly record struct ImpactedUsage(string VideogameId, string SourceField);

readonly record struct MissingReference(string Reference, IReadOnlyList<ImpactedUsage> Usages);

readonly record struct AuditReport(
    DateTime GeneratedAtUtc,
    string BucketName,
    int TotalReferencedInternal,
    int TotalBucketObjects,
    int HealthyCount,
    int MissingCount,
    int ExternalUrlCount,
    IReadOnlyList<MissingReference> MissingReferences);

sealed class AuditOptions
{
    public required string ConnectionString { get; init; }
    public required string Endpoint { get; init; }
    public required string User { get; init; }
    public required string Secret { get; init; }
    public required string BucketName { get; init; }
    public required string Region { get; init; }
    public required bool UseSsl { get; init; }
    public required string OutputDirectory { get; init; }

    public static AuditOptions FromEnvironment()
    {
        return new AuditOptions
        {
            ConnectionString = RequireEnv("AUDIT_DB_CONNECTION_STRING"),
            Endpoint = RequireEnv("AUDIT_MINIO_ENDPOINT"),
            User = RequireEnv("AUDIT_MINIO_USER"),
            Secret = RequireEnv("AUDIT_MINIO_SECRET"),
            BucketName = RequireEnv("AUDIT_MINIO_BUCKET"),
            Region = Environment.GetEnvironmentVariable("AUDIT_MINIO_REGION") ?? "us-east-1",
            UseSsl = bool.TryParse(Environment.GetEnvironmentVariable("AUDIT_MINIO_USE_SSL"), out var useSsl) && useSsl,
            OutputDirectory = Environment.GetEnvironmentVariable("AUDIT_OUTPUT_DIR")
                ?? Path.Combine(Directory.GetCurrentDirectory(), "audit-output")
        };
    }

    private static string RequireEnv(string variableName)
    {
        var value = Environment.GetEnvironmentVariable(variableName);
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"Environment variable '{variableName}' is required.");
        }

        return value;
    }
}
