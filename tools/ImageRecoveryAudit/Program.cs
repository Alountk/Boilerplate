using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Amazon.S3;
using Amazon.S3.Model;
using Npgsql;

var options = AuditOptions.FromEnvironment();
Directory.CreateDirectory(options.OutputDirectory);

if (options.Mode is AuditMode.All or AuditMode.Storage)
{
    Console.WriteLine("[audit] Running storage image audit...");
    var storageReport = await RunStorageAuditAsync(options);

    var jsonPath = Path.Combine(options.OutputDirectory, "image-recovery-audit.json");
    await File.WriteAllTextAsync(jsonPath, JsonSerializer.Serialize(storageReport, new JsonSerializerOptions
    {
        WriteIndented = true
    }));

    var csvPath = Path.Combine(options.OutputDirectory, "missing-image-references.csv");
    await WriteMissingCsvAsync(csvPath, storageReport.MissingReferences);

    Console.WriteLine($"[audit] Missing references: {storageReport.MissingCount}");
    Console.WriteLine($"[audit] JSON report: {jsonPath}");
    Console.WriteLine($"[audit] CSV report: {csvPath}");
}

if (options.Mode is AuditMode.All or AuditMode.FrontendAssets)
{
    Console.WriteLine("[audit] Running frontend assets audit...");
    var frontendReport = RunFrontendAssetsAudit(options);

    var frontendJsonPath = Path.Combine(options.OutputDirectory, "frontend-assets-audit.json");
    await File.WriteAllTextAsync(frontendJsonPath, JsonSerializer.Serialize(frontendReport, new JsonSerializerOptions
    {
        WriteIndented = true
    }));

    var frontendMissingCsvPath = Path.Combine(options.OutputDirectory, "missing-frontend-assets.csv");
    await WriteMissingFrontendAssetsCsvAsync(frontendMissingCsvPath, frontendReport.MissingAssets);

    var frontendUnusedCsvPath = Path.Combine(options.OutputDirectory, "unused-frontend-assets.csv");
    await WriteUnusedFrontendAssetsCsvAsync(frontendUnusedCsvPath, frontendReport.UnusedAssets);

    Console.WriteLine($"[audit] Missing frontend assets: {frontendReport.MissingAssetCount}");
    Console.WriteLine($"[audit] Unused frontend assets: {frontendReport.UnusedAssetCount}");
    Console.WriteLine($"[audit] Frontend JSON report: {frontendJsonPath}");
    Console.WriteLine($"[audit] Frontend missing CSV: {frontendMissingCsvPath}");
    Console.WriteLine($"[audit] Frontend unused CSV: {frontendUnusedCsvPath}");
}

return 0;

static async Task<StorageAuditReport> RunStorageAuditAsync(AuditOptions options)
{
    if (string.IsNullOrWhiteSpace(options.ConnectionString) ||
        string.IsNullOrWhiteSpace(options.Endpoint) ||
        string.IsNullOrWhiteSpace(options.User) ||
        string.IsNullOrWhiteSpace(options.Secret) ||
        string.IsNullOrWhiteSpace(options.BucketName) ||
        string.IsNullOrWhiteSpace(options.Region))
    {
        throw new InvalidOperationException("Storage audit requires database and MinIO/S3 configuration.");
    }

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
    var missingReferenceSet = missingReferences.ToHashSet(StringComparer.Ordinal);

    var impactedByReference = referencedRecords
        .Where(r => r.Kind == ReferenceKind.InternalKey && missingReferenceSet.Contains(r.Reference))
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

    return new StorageAuditReport(
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
}

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
    if (string.IsNullOrWhiteSpace(options.Endpoint) ||
        string.IsNullOrWhiteSpace(options.User) ||
        string.IsNullOrWhiteSpace(options.Secret) ||
        string.IsNullOrWhiteSpace(options.BucketName) ||
        string.IsNullOrWhiteSpace(options.Region))
    {
        throw new InvalidOperationException("Storage audit options are incomplete.");
    }

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

static FrontendAssetsAuditReport RunFrontendAssetsAudit(AuditOptions options)
{
    if (string.IsNullOrWhiteSpace(options.FrontendPublicDirectory) ||
        !Directory.Exists(options.FrontendPublicDirectory))
    {
        throw new InvalidOperationException(
            $"Frontend public directory does not exist: '{options.FrontendPublicDirectory}'. Set AUDIT_FRONTEND_PUBLIC_DIR.");
    }

    if (string.IsNullOrWhiteSpace(options.FrontendSourceDirectory) ||
        !Directory.Exists(options.FrontendSourceDirectory))
    {
        throw new InvalidOperationException(
            $"Frontend source directory does not exist: '{options.FrontendSourceDirectory}'. Set AUDIT_FRONTEND_SOURCE_DIR.");
    }

    var references = LoadFrontendAssetReferences(options.FrontendSourceDirectory);
    var groupedReferences = references
        .GroupBy(x => x.AssetPath, StringComparer.Ordinal)
        .ToDictionary(
            group => group.Key,
            group => group
                .OrderBy(x => x.SourceFile, StringComparer.Ordinal)
                .ThenBy(x => x.Line, Comparer<int>.Default)
                .ToList(),
            StringComparer.Ordinal);

    var existingAssets = LoadFrontendPublicAssetPaths(options.FrontendPublicDirectory);
    var missingAssets = groupedReferences.Keys
        .Where(asset => !existingAssets.Contains(asset))
        .OrderBy(asset => asset, StringComparer.Ordinal)
        .Select(asset => new MissingFrontendAsset(asset, groupedReferences[asset]))
        .ToList();

    var referencedAssetSet = groupedReferences.Keys.ToHashSet(StringComparer.Ordinal);
    var unusedAssets = existingAssets
        .Where(asset => !referencedAssetSet.Contains(asset))
        .OrderBy(asset => asset, StringComparer.Ordinal)
        .ToList();

    return new FrontendAssetsAuditReport(
        GeneratedAtUtc: DateTime.UtcNow,
        FrontendSourceDirectory: options.FrontendSourceDirectory,
        FrontendPublicDirectory: options.FrontendPublicDirectory,
        TotalAssetReferences: references.Count,
        DistinctReferencedAssets: groupedReferences.Count,
        ExistingAssetFiles: existingAssets.Count,
        MissingAssetCount: missingAssets.Count,
        UnusedAssetCount: unusedAssets.Count,
        MissingAssets: missingAssets,
        UnusedAssets: unusedAssets);
}

static List<FrontendAssetUsage> LoadFrontendAssetReferences(string sourceDirectory)
{
    var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".mjs",
        ".cjs",
        ".css",
        ".scss",
        ".sass",
        ".mdx",
        ".json",
    };

    var results = new List<FrontendAssetUsage>();
    var referenceRegex = new Regex(@"/assets/[A-Za-z0-9_./-]+", RegexOptions.Compiled);

    foreach (var file in Directory.EnumerateFiles(sourceDirectory, "*", SearchOption.AllDirectories))
    {
        if (!allowedExtensions.Contains(Path.GetExtension(file)))
        {
            continue;
        }

        var relativeFile = Path.GetRelativePath(sourceDirectory, file).Replace('\\', '/');
        var lines = File.ReadAllLines(file);

        for (var index = 0; index < lines.Length; index++)
        {
            var line = lines[index];
            var matches = referenceRegex.Matches(line);
            foreach (Match match in matches)
            {
                var assetPath = match.Value;
                if (!string.IsNullOrWhiteSpace(assetPath))
                {
                    results.Add(new FrontendAssetUsage(assetPath, relativeFile, index + 1));
                }
            }
        }
    }

    return results;
}

static HashSet<string> LoadFrontendPublicAssetPaths(string publicDirectory)
{
    var assetsRoot = Path.Combine(publicDirectory, "assets");
    if (!Directory.Exists(assetsRoot))
    {
        return new HashSet<string>(StringComparer.Ordinal);
    }

    return Directory
        .EnumerateFiles(assetsRoot, "*", SearchOption.AllDirectories)
        .Select(file =>
        {
            var relative = Path.GetRelativePath(publicDirectory, file).Replace('\\', '/');
            return $"/{relative}";
        })
        .ToHashSet(StringComparer.Ordinal);
}

static async Task WriteMissingFrontendAssetsCsvAsync(string path, IReadOnlyList<MissingFrontendAsset> missingAssets)
{
    var sb = new StringBuilder();
    sb.AppendLine("asset_path,source_file,line");

    foreach (var missing in missingAssets)
    {
        if (missing.Usages.Count == 0)
        {
            sb.AppendLine($"{CsvEscape(missing.AssetPath)},,");
            continue;
        }

        foreach (var usage in missing.Usages)
        {
            sb.AppendLine(
                string.Create(
                    CultureInfo.InvariantCulture,
                    $"{CsvEscape(missing.AssetPath)},{CsvEscape(usage.SourceFile)},{usage.Line}"));
        }
    }

    await File.WriteAllTextAsync(path, sb.ToString());
}

static async Task WriteUnusedFrontendAssetsCsvAsync(string path, IReadOnlyList<string> unusedAssets)
{
    var sb = new StringBuilder();
    sb.AppendLine("asset_path");

    foreach (var asset in unusedAssets)
    {
        sb.AppendLine(CsvEscape(asset));
    }

    await File.WriteAllTextAsync(path, sb.ToString());
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

readonly record struct StorageAuditReport(
    DateTime GeneratedAtUtc,
    string BucketName,
    int TotalReferencedInternal,
    int TotalBucketObjects,
    int HealthyCount,
    int MissingCount,
    int ExternalUrlCount,
    IReadOnlyList<MissingReference> MissingReferences);

readonly record struct FrontendAssetUsage(string AssetPath, string SourceFile, int Line);

readonly record struct MissingFrontendAsset(string AssetPath, IReadOnlyList<FrontendAssetUsage> Usages);

readonly record struct FrontendAssetsAuditReport(
    DateTime GeneratedAtUtc,
    string FrontendSourceDirectory,
    string FrontendPublicDirectory,
    int TotalAssetReferences,
    int DistinctReferencedAssets,
    int ExistingAssetFiles,
    int MissingAssetCount,
    int UnusedAssetCount,
    IReadOnlyList<MissingFrontendAsset> MissingAssets,
    IReadOnlyList<string> UnusedAssets);

enum AuditMode
{
    All,
    Storage,
    FrontendAssets,
}

sealed class AuditOptions
{
    public required AuditMode Mode { get; init; }
    public string ConnectionString { get; init; } = string.Empty;
    public string Endpoint { get; init; } = string.Empty;
    public string User { get; init; } = string.Empty;
    public string Secret { get; init; } = string.Empty;
    public string BucketName { get; init; } = string.Empty;
    public string Region { get; init; } = string.Empty;
    public required bool UseSsl { get; init; }
    public required string OutputDirectory { get; init; }
    public required string FrontendPublicDirectory { get; init; }
    public required string FrontendSourceDirectory { get; init; }

    public static AuditOptions FromEnvironment()
    {
        var mode = ParseMode(Environment.GetEnvironmentVariable("AUDIT_MODE"));
        var currentDirectory = Directory.GetCurrentDirectory();
        var defaultFrontendRoot = Path.Combine(currentDirectory, "Videogames.Web");

        return new AuditOptions
        {
            Mode = mode,
            ConnectionString = mode is AuditMode.All or AuditMode.Storage
                ? RequireEnv("AUDIT_DB_CONNECTION_STRING")
                : string.Empty,
            Endpoint = mode is AuditMode.All or AuditMode.Storage
                ? RequireEnv("AUDIT_MINIO_ENDPOINT")
                : string.Empty,
            User = mode is AuditMode.All or AuditMode.Storage
                ? RequireEnv("AUDIT_MINIO_USER")
                : string.Empty,
            Secret = mode is AuditMode.All or AuditMode.Storage
                ? RequireEnv("AUDIT_MINIO_SECRET")
                : string.Empty,
            BucketName = mode is AuditMode.All or AuditMode.Storage
                ? RequireEnv("AUDIT_MINIO_BUCKET")
                : string.Empty,
            Region = mode is AuditMode.All or AuditMode.Storage
                ? Environment.GetEnvironmentVariable("AUDIT_MINIO_REGION") ?? "us-east-1"
                : string.Empty,
            UseSsl = bool.TryParse(Environment.GetEnvironmentVariable("AUDIT_MINIO_USE_SSL"), out var useSsl) && useSsl,
            OutputDirectory = Environment.GetEnvironmentVariable("AUDIT_OUTPUT_DIR")
                ?? Path.Combine(Directory.GetCurrentDirectory(), "audit-output")
            ,
            FrontendPublicDirectory = Environment.GetEnvironmentVariable("AUDIT_FRONTEND_PUBLIC_DIR")
                ?? Path.Combine(defaultFrontendRoot, "public"),
            FrontendSourceDirectory = Environment.GetEnvironmentVariable("AUDIT_FRONTEND_SOURCE_DIR")
                ?? Path.Combine(defaultFrontendRoot, "src")
        };
    }

    private static AuditMode ParseMode(string? rawMode)
    {
        return rawMode?.Trim().ToLowerInvariant() switch
        {
            null or "" or "all" => AuditMode.All,
            "storage" => AuditMode.Storage,
            "frontend-assets" => AuditMode.FrontendAssets,
            _ => throw new InvalidOperationException(
                "Environment variable 'AUDIT_MODE' must be one of: all, storage, frontend-assets.")
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
