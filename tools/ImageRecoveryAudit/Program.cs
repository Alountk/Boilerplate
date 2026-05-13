using System.Globalization;
using System.Security.Cryptography;
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

if (options.Mode is AuditMode.Recover)
{
    Console.WriteLine("[audit] Running storage recovery (missing refs -> MinIO/S3)...");
    var recoveryReport = await RunRecoveryAsync(options);

    var recoveryJsonPath = Path.Combine(options.OutputDirectory, "image-recovery-run.json");
    await File.WriteAllTextAsync(recoveryJsonPath, JsonSerializer.Serialize(recoveryReport, new JsonSerializerOptions
    {
        WriteIndented = true
    }));

    var recoveryCsvPath = Path.Combine(options.OutputDirectory, "image-recovery-run.csv");
    await WriteRecoveryCsvAsync(recoveryCsvPath, recoveryReport.Results);

    Console.WriteLine($"[audit] Recovery mode: {(options.RecoveryDryRun ? "dry-run" : "apply")}");
    Console.WriteLine($"[audit] Total references in CSV: {recoveryReport.TotalReferences}");
    Console.WriteLine($"[audit] Already in bucket: {recoveryReport.AlreadyPresentCount}");
    Console.WriteLine($"[audit] Recovered: {recoveryReport.RecoveredCount}");
    Console.WriteLine($"[audit] Missing source: {recoveryReport.MissingSourceCount}");
    Console.WriteLine($"[audit] Failed uploads: {recoveryReport.FailedCount}");
    Console.WriteLine($"[audit] Recovery JSON report: {recoveryJsonPath}");
    Console.WriteLine($"[audit] Recovery CSV report: {recoveryCsvPath}");
}

if (options.Mode is AuditMode.MigrateExternal)
{
    Console.WriteLine("[audit] Running external URL migration (external URLs -> MinIO/S3 keys)...");
    var externalMigrationReport = await RunExternalMigrationAsync(options);

    var migrationJsonPath = Path.Combine(options.OutputDirectory, "external-url-migration-run.json");
    await File.WriteAllTextAsync(migrationJsonPath, JsonSerializer.Serialize(externalMigrationReport, new JsonSerializerOptions
    {
        WriteIndented = true
    }));

    var migrationCsvPath = Path.Combine(options.OutputDirectory, "external-url-migration-run.csv");
    await WriteExternalMigrationCsvAsync(migrationCsvPath, externalMigrationReport.Results);

    Console.WriteLine($"[audit] External migration mode: {(options.ExternalMigrationDryRun ? "dry-run" : "apply")}");
    Console.WriteLine($"[audit] Distinct external URLs: {externalMigrationReport.DistinctExternalUrls}");
    Console.WriteLine($"[audit] Planned: {externalMigrationReport.PlannedCount}");
    Console.WriteLine($"[audit] Uploaded: {externalMigrationReport.UploadedCount}");
    Console.WriteLine($"[audit] Failed downloads: {externalMigrationReport.FailedDownloadCount}");
    Console.WriteLine($"[audit] Failed uploads: {externalMigrationReport.FailedUploadCount}");
    Console.WriteLine($"[audit] Db updates affected rows: {externalMigrationReport.DbUpdatedRows}");
    Console.WriteLine($"[audit] Migration JSON report: {migrationJsonPath}");
    Console.WriteLine($"[audit] Migration CSV report: {migrationCsvPath}");
}

if (options.Mode is AuditMode.SyncFrontendAssets)
{
    Console.WriteLine("[audit] Running frontend assets sync (public/assets -> MinIO/S3)...");
    var assetsSyncReport = await RunFrontendAssetsSyncAsync(options);

    var assetsSyncJsonPath = Path.Combine(options.OutputDirectory, "frontend-assets-sync-run.json");
    await File.WriteAllTextAsync(assetsSyncJsonPath, JsonSerializer.Serialize(assetsSyncReport, new JsonSerializerOptions
    {
        WriteIndented = true
    }));

    var assetsSyncCsvPath = Path.Combine(options.OutputDirectory, "frontend-assets-sync-run.csv");
    await WriteFrontendAssetsSyncCsvAsync(assetsSyncCsvPath, assetsSyncReport.Results);

    Console.WriteLine($"[audit] Assets sync mode: {(options.FrontendAssetsSyncDryRun ? "dry-run" : "apply")}");
    Console.WriteLine($"[audit] Local assets discovered: {assetsSyncReport.LocalAssetsCount}");
    Console.WriteLine($"[audit] Already present: {assetsSyncReport.AlreadyPresentCount}");
    Console.WriteLine($"[audit] Planned uploads: {assetsSyncReport.PlannedUploadsCount}");
    Console.WriteLine($"[audit] Uploaded: {assetsSyncReport.UploadedCount}");
    Console.WriteLine($"[audit] Failed uploads: {assetsSyncReport.FailedUploadsCount}");
    Console.WriteLine($"[audit] Assets sync JSON report: {assetsSyncJsonPath}");
    Console.WriteLine($"[audit] Assets sync CSV report: {assetsSyncCsvPath}");
}

return 0;

static async Task<FrontendAssetsSyncReport> RunFrontendAssetsSyncAsync(AuditOptions options)
{
    if (string.IsNullOrWhiteSpace(options.FrontendPublicDirectory) ||
        !Directory.Exists(options.FrontendPublicDirectory))
    {
        throw new InvalidOperationException(
            $"Frontend public directory does not exist: '{options.FrontendPublicDirectory}'. Set AUDIT_FRONTEND_PUBLIC_DIR.");
    }

    if (string.IsNullOrWhiteSpace(options.Endpoint) ||
        string.IsNullOrWhiteSpace(options.User) ||
        string.IsNullOrWhiteSpace(options.Secret) ||
        string.IsNullOrWhiteSpace(options.BucketName) ||
        string.IsNullOrWhiteSpace(options.Region))
    {
        throw new InvalidOperationException("Frontend assets sync requires MinIO/S3 configuration.");
    }

    var localAssets = LoadFrontendPublicAssetPaths(options.FrontendPublicDirectory)
        .OrderBy(x => x, StringComparer.Ordinal)
        .ToList();

    Console.WriteLine($"[audit] Local frontend assets discovered: {localAssets.Count}");

    if (options.FrontendAssetsSyncDryRun)
    {
        var dryRunResults = localAssets
            .Select(assetPath => new FrontendAssetsSyncResult(
                AssetPath: assetPath,
                TargetKey: BuildFrontendAssetTargetKey(assetPath, options.FrontendAssetsSyncPrefix),
                Status: FrontendAssetsSyncStatus.PlannedDryRun,
                ErrorMessage: string.Empty))
            .ToList();

        return new FrontendAssetsSyncReport(
            GeneratedAtUtc: DateTime.UtcNow,
            BucketName: options.BucketName,
            Prefix: options.FrontendAssetsSyncPrefix,
            IsDryRun: true,
            LocalAssetsCount: localAssets.Count,
            AlreadyPresentCount: 0,
            PlannedUploadsCount: dryRunResults.Count,
            UploadedCount: 0,
            FailedUploadsCount: 0,
            Results: dryRunResults);
    }

    HashSet<string> bucketObjects;
    try
    {
        bucketObjects = await LoadBucketObjectKeysAsync(options);
        Console.WriteLine($"[audit] Objects currently in bucket: {bucketObjects.Count}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[audit] Warning: unable to list bucket objects. Proceeding with upload attempts. Reason: {ex.Message}");
        bucketObjects = new HashSet<string>(StringComparer.Ordinal);
    }

    var endpoint = options.Endpoint;
    if (!endpoint.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
        !endpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
    {
        endpoint = $"http://{endpoint}";
    }

    var s3Config = new AmazonS3Config
    {
        ServiceURL = endpoint,
        AuthenticationRegion = options.Region,
        ForcePathStyle = true,
        UseHttp = !options.UseSsl,
    };

    using var s3Client = new AmazonS3Client(options.User, options.Secret, s3Config);

    var results = new List<FrontendAssetsSyncResult>(localAssets.Count);

    foreach (var assetPath in localAssets)
    {
        var assetRelativePath = assetPath.TrimStart('/');
        var localPath = Path.Combine(options.FrontendPublicDirectory, assetRelativePath.Replace('/', Path.DirectorySeparatorChar));

        if (!File.Exists(localPath))
        {
            results.Add(new FrontendAssetsSyncResult(assetPath, string.Empty, FrontendAssetsSyncStatus.MissingLocalFile, "Local file not found."));
            continue;
        }

        var targetKey = BuildFrontendAssetTargetKey(assetPath, options.FrontendAssetsSyncPrefix);
        if (bucketObjects.Contains(targetKey))
        {
            results.Add(new FrontendAssetsSyncResult(assetPath, targetKey, FrontendAssetsSyncStatus.AlreadyPresent, string.Empty));
            continue;
        }

        if (options.FrontendAssetsSyncDryRun)
        {
            results.Add(new FrontendAssetsSyncResult(assetPath, targetKey, FrontendAssetsSyncStatus.PlannedDryRun, string.Empty));
            continue;
        }

        try
        {
            var fileBytes = await File.ReadAllBytesAsync(localPath);
            await using var stream = new MemoryStream(fileBytes, writable: false);

            await s3Client.PutObjectAsync(new PutObjectRequest
            {
                BucketName = options.BucketName,
                Key = targetKey,
                InputStream = stream,
                ContentType = GetContentTypeFromExtension(Path.GetExtension(localPath)),
                AutoCloseStream = false,
                AutoResetStreamPosition = true
            });

            results.Add(new FrontendAssetsSyncResult(assetPath, targetKey, FrontendAssetsSyncStatus.Uploaded, string.Empty));
        }
        catch (Exception ex)
        {
            results.Add(new FrontendAssetsSyncResult(assetPath, targetKey, FrontendAssetsSyncStatus.FailedUpload, ex.Message));
        }
    }

    return new FrontendAssetsSyncReport(
        GeneratedAtUtc: DateTime.UtcNow,
        BucketName: options.BucketName,
        Prefix: options.FrontendAssetsSyncPrefix,
        IsDryRun: options.FrontendAssetsSyncDryRun,
        LocalAssetsCount: localAssets.Count,
        AlreadyPresentCount: results.Count(r => r.Status == FrontendAssetsSyncStatus.AlreadyPresent),
        PlannedUploadsCount: results.Count(r => r.Status == FrontendAssetsSyncStatus.PlannedDryRun),
        UploadedCount: results.Count(r => r.Status == FrontendAssetsSyncStatus.Uploaded),
        FailedUploadsCount: results.Count(r => r.Status == FrontendAssetsSyncStatus.FailedUpload),
        Results: results);
}

static async Task<ExternalMigrationReport> RunExternalMigrationAsync(AuditOptions options)
{
    if (string.IsNullOrWhiteSpace(options.ConnectionString))
    {
        throw new InvalidOperationException("External migration requires database configuration.");
    }

    Console.WriteLine("[audit] Loading image references from database...");
    var referencedRecords = await LoadReferencedImageRecordsAsync(options.ConnectionString);
    var externalReferences = referencedRecords
        .Where(r => r.Kind == ReferenceKind.ExternalUrl)
        .Select(r => r.Reference)
        .Distinct(StringComparer.Ordinal)
        .OrderBy(x => x, StringComparer.Ordinal)
        .ToList();

    Console.WriteLine($"[audit] Distinct external URLs found: {externalReferences.Count}");

    if (externalReferences.Count == 0)
    {
        return new ExternalMigrationReport(
            GeneratedAtUtc: DateTime.UtcNow,
            BucketName: options.BucketName,
            KeyPrefix: options.ExternalMigrationKeyPrefix,
            IsDryRun: options.ExternalMigrationDryRun,
            DistinctExternalUrls: 0,
            PlannedCount: 0,
            UploadedCount: 0,
            FailedDownloadCount: 0,
            FailedUploadCount: 0,
            SkippedHostCount: 0,
            DbUpdatedRows: 0,
            Results: []);
    }

    var filtered = externalReferences
        .Where(url => ShouldMigrateExternalUrl(url, options.ExternalMigrationAllowedHosts))
        .ToList();
    var skippedHostCount = externalReferences.Count - filtered.Count;

    Console.WriteLine($"[audit] External URLs selected for migration: {filtered.Count}");
    if (skippedHostCount > 0)
    {
        Console.WriteLine($"[audit] External URLs skipped by host filter: {skippedHostCount}");
    }

    var results = new List<ExternalMigrationResult>(externalReferences.Count);
    var mappingForDb = new Dictionary<string, string>(StringComparer.Ordinal);

    if (options.ExternalMigrationDryRun)
    {
        foreach (var sourceUrl in filtered)
        {
            var key = BuildExternalTargetKey(sourceUrl, options.ExternalMigrationKeyPrefix);
            results.Add(new ExternalMigrationResult(sourceUrl, key, ExternalMigrationStatus.PlannedDryRun, string.Empty));
            mappingForDb[sourceUrl] = key;
        }

        foreach (var sourceUrl in externalReferences.Except(filtered, StringComparer.Ordinal))
        {
            results.Add(new ExternalMigrationResult(sourceUrl, string.Empty, ExternalMigrationStatus.SkippedHostFilter, "Host is not allowed by AUDIT_EXTERNAL_ALLOWED_HOSTS."));
        }

        return new ExternalMigrationReport(
            GeneratedAtUtc: DateTime.UtcNow,
            BucketName: options.BucketName,
            KeyPrefix: options.ExternalMigrationKeyPrefix,
            IsDryRun: true,
            DistinctExternalUrls: externalReferences.Count,
            PlannedCount: mappingForDb.Count,
            UploadedCount: 0,
            FailedDownloadCount: 0,
            FailedUploadCount: 0,
            SkippedHostCount: skippedHostCount,
            DbUpdatedRows: 0,
            Results: results.OrderBy(r => r.SourceUrl, StringComparer.Ordinal).ToList());
    }

    if (string.IsNullOrWhiteSpace(options.Endpoint) ||
        string.IsNullOrWhiteSpace(options.User) ||
        string.IsNullOrWhiteSpace(options.Secret) ||
        string.IsNullOrWhiteSpace(options.BucketName) ||
        string.IsNullOrWhiteSpace(options.Region))
    {
        throw new InvalidOperationException("External migration apply mode requires MinIO/S3 configuration.");
    }

    var endpoint = options.Endpoint;
    if (!endpoint.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
        !endpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
    {
        endpoint = $"http://{endpoint}";
    }

    var s3Config = new AmazonS3Config
    {
        ServiceURL = endpoint,
        AuthenticationRegion = options.Region,
        ForcePathStyle = true,
        UseHttp = !options.UseSsl,
    };

    using var s3Client = new AmazonS3Client(options.User, options.Secret, s3Config);
    using var httpClient = new HttpClient
    {
        Timeout = TimeSpan.FromSeconds(30)
    };

    foreach (var sourceUrl in filtered)
    {
        var key = BuildExternalTargetKey(sourceUrl, options.ExternalMigrationKeyPrefix);

        try
        {
            using var response = await httpClient.GetAsync(sourceUrl, HttpCompletionOption.ResponseHeadersRead);
            if (!response.IsSuccessStatusCode)
            {
                results.Add(new ExternalMigrationResult(sourceUrl, key, ExternalMigrationStatus.FailedDownload, $"Download failed with {(int)response.StatusCode}."));
                continue;
            }

            var contentBytes = await response.Content.ReadAsByteArrayAsync();
            await using var sourceStream = new MemoryStream(contentBytes, writable: false);
            var contentType = response.Content.Headers.ContentType?.MediaType
                ?? GetContentTypeFromExtension(Path.GetExtension(new Uri(sourceUrl).AbsolutePath));

            await s3Client.PutObjectAsync(new PutObjectRequest
            {
                BucketName = options.BucketName,
                Key = key,
                InputStream = sourceStream,
                ContentType = contentType,
                AutoCloseStream = false,
                AutoResetStreamPosition = true
            });

            mappingForDb[sourceUrl] = key;
            results.Add(new ExternalMigrationResult(sourceUrl, key, ExternalMigrationStatus.Uploaded, string.Empty));
        }
        catch (HttpRequestException ex)
        {
            results.Add(new ExternalMigrationResult(sourceUrl, key, ExternalMigrationStatus.FailedDownload, ex.Message));
        }
        catch (AmazonS3Exception ex)
        {
            results.Add(new ExternalMigrationResult(sourceUrl, key, ExternalMigrationStatus.FailedUpload, ex.Message));
        }
        catch (Exception ex)
        {
            results.Add(new ExternalMigrationResult(sourceUrl, key, ExternalMigrationStatus.FailedUpload, ex.Message));
        }
    }

    foreach (var sourceUrl in externalReferences.Except(filtered, StringComparer.Ordinal))
    {
        results.Add(new ExternalMigrationResult(sourceUrl, string.Empty, ExternalMigrationStatus.SkippedHostFilter, "Host is not allowed by AUDIT_EXTERNAL_ALLOWED_HOSTS."));
    }

    var dbUpdatedRows = mappingForDb.Count == 0
        ? 0
        : await UpdateExternalReferencesAsync(options.ConnectionString, mappingForDb);

    return new ExternalMigrationReport(
        GeneratedAtUtc: DateTime.UtcNow,
        BucketName: options.BucketName,
        KeyPrefix: options.ExternalMigrationKeyPrefix,
        IsDryRun: false,
        DistinctExternalUrls: externalReferences.Count,
        PlannedCount: filtered.Count,
        UploadedCount: results.Count(r => r.Status == ExternalMigrationStatus.Uploaded),
        FailedDownloadCount: results.Count(r => r.Status == ExternalMigrationStatus.FailedDownload),
        FailedUploadCount: results.Count(r => r.Status == ExternalMigrationStatus.FailedUpload),
        SkippedHostCount: skippedHostCount,
        DbUpdatedRows: dbUpdatedRows,
        Results: results.OrderBy(r => r.SourceUrl, StringComparer.Ordinal).ToList());
}

static async Task<RecoveryReport> RunRecoveryAsync(AuditOptions options)
{
    if (string.IsNullOrWhiteSpace(options.Endpoint) ||
        string.IsNullOrWhiteSpace(options.User) ||
        string.IsNullOrWhiteSpace(options.Secret) ||
        string.IsNullOrWhiteSpace(options.BucketName) ||
        string.IsNullOrWhiteSpace(options.Region))
    {
        throw new InvalidOperationException("Recover mode requires MinIO/S3 configuration.");
    }

    if (string.IsNullOrWhiteSpace(options.RecoverySourceDirectory) ||
        !Directory.Exists(options.RecoverySourceDirectory))
    {
        throw new InvalidOperationException(
            $"Recovery source directory does not exist: '{options.RecoverySourceDirectory}'. Set AUDIT_RECOVERY_SOURCE_DIR.");
    }

    if (string.IsNullOrWhiteSpace(options.RecoveryMissingCsvPath) ||
        !File.Exists(options.RecoveryMissingCsvPath))
    {
        throw new InvalidOperationException(
            $"Recovery missing CSV does not exist: '{options.RecoveryMissingCsvPath}'. Set AUDIT_RECOVERY_MISSING_CSV.");
    }

    var references = await LoadMissingReferencesFromCsvAsync(options.RecoveryMissingCsvPath);
    var distinctReferences = references
        .Where(x => !string.IsNullOrWhiteSpace(x))
        .Distinct(StringComparer.Ordinal)
        .OrderBy(x => x, StringComparer.Ordinal)
        .ToList();

    Console.WriteLine($"[audit] Distinct references to process: {distinctReferences.Count}");

    var bucketObjects = await LoadBucketObjectKeysAsync(options);
    Console.WriteLine($"[audit] Objects currently in bucket: {bucketObjects.Count}");

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

    var results = new List<RecoveryResult>(distinctReferences.Count);

    foreach (var reference in distinctReferences)
    {
        if (bucketObjects.Contains(reference))
        {
            results.Add(new RecoveryResult(reference, RecoveryStatus.AlreadyPresent, string.Empty, string.Empty));
            continue;
        }

        var sourceFile = FindSourceFile(options.RecoverySourceDirectory, reference);
        if (sourceFile is null)
        {
            results.Add(new RecoveryResult(reference, RecoveryStatus.MissingSource, string.Empty, "Source file not found."));
            continue;
        }

        if (options.RecoveryDryRun)
        {
            results.Add(new RecoveryResult(reference, RecoveryStatus.RecoveredDryRun, sourceFile, string.Empty));
            continue;
        }

        try
        {
            await using var stream = File.OpenRead(sourceFile);
            await client.PutObjectAsync(new PutObjectRequest
            {
                BucketName = options.BucketName,
                Key = reference,
                InputStream = stream,
                ContentType = GetContentTypeFromExtension(Path.GetExtension(sourceFile))
            });

            results.Add(new RecoveryResult(reference, RecoveryStatus.Recovered, sourceFile, string.Empty));
        }
        catch (Exception ex)
        {
            results.Add(new RecoveryResult(reference, RecoveryStatus.Failed, sourceFile, ex.Message));
        }
    }

    return new RecoveryReport(
        GeneratedAtUtc: DateTime.UtcNow,
        BucketName: options.BucketName,
        SourceDirectory: options.RecoverySourceDirectory,
        MissingCsvPath: options.RecoveryMissingCsvPath,
        IsDryRun: options.RecoveryDryRun,
        TotalReferences: distinctReferences.Count,
        AlreadyPresentCount: results.Count(r => r.Status == RecoveryStatus.AlreadyPresent),
        RecoveredCount: results.Count(r => r.Status is RecoveryStatus.Recovered or RecoveryStatus.RecoveredDryRun),
        MissingSourceCount: results.Count(r => r.Status == RecoveryStatus.MissingSource),
        FailedCount: results.Count(r => r.Status == RecoveryStatus.Failed),
        Results: results);
}

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
    var externalHosts = referencedRecords
        .Where(r => r.Kind == ReferenceKind.ExternalUrl)
        .Select(r => TryGetHost(r.Reference))
        .Where(host => !string.IsNullOrWhiteSpace(host))
        .Select(host => host!)
        .GroupBy(host => host, StringComparer.OrdinalIgnoreCase)
        .Select(group => new { Host = group.Key, Count = group.Count() })
        .OrderByDescending(x => x.Count)
        .ThenBy(x => x.Host, StringComparer.OrdinalIgnoreCase)
        .Take(5)
        .ToList();

    var internalReferences = referencedRecords
        .Where(r => r.Kind == ReferenceKind.InternalKey)
        .Select(r => r.Reference)
        .Distinct(StringComparer.Ordinal)
        .ToHashSet(StringComparer.Ordinal);

    Console.WriteLine($"[audit] Internal references: {internalReferences.Count}");
    Console.WriteLine($"[audit] External URLs skipped: {externalUrlCount}");

    if (externalHosts.Count > 0)
    {
        Console.WriteLine("[audit] Top external URL hosts:");
        foreach (var host in externalHosts)
        {
            Console.WriteLine($"[audit]   - {host.Host}: {host.Count}");
        }
    }

    if (internalReferences.Count == 0)
    {
        return new StorageAuditReport(
            GeneratedAtUtc: DateTime.UtcNow,
            BucketName: options.BucketName,
            TotalReferencedInternal: 0,
            TotalBucketObjects: 0,
            HealthyCount: 0,
            MissingCount: 0,
            ExternalUrlCount: externalUrlCount,
            MissingReferences: []);
    }

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

static string? TryGetHost(string value)
{
    if (!Uri.TryCreate(value, UriKind.Absolute, out var uri))
    {
        return null;
    }

    return uri.Host;
}

static bool ShouldMigrateExternalUrl(string url, IReadOnlySet<string> allowedHosts)
{
    if (allowedHosts.Count == 0)
    {
        return true;
    }

    var host = TryGetHost(url);
    return host is not null && allowedHosts.Contains(host);
}

static string BuildExternalTargetKey(string sourceUrl, string keyPrefix)
{
    var uri = new Uri(sourceUrl, UriKind.Absolute);
    var extension = Path.GetExtension(uri.AbsolutePath);
    var normalizedPrefix = string.IsNullOrWhiteSpace(keyPrefix)
        ? "external"
        : keyPrefix.Trim().Trim('/');

    var hash = ComputeSha256Hex(sourceUrl)[..24];
    var safeExtension = string.IsNullOrWhiteSpace(extension) ? ".bin" : extension.ToLowerInvariant();

    return $"{normalizedPrefix}/{hash}{safeExtension}";
}

static string BuildFrontendAssetTargetKey(string assetPath, string prefix)
{
    var normalizedPrefix = string.IsNullOrWhiteSpace(prefix)
        ? string.Empty
        : prefix.Trim().Trim('/');

    var normalizedAssetPath = assetPath.Trim().TrimStart('/');
    if (string.IsNullOrWhiteSpace(normalizedPrefix))
    {
        return normalizedAssetPath;
    }

    return $"{normalizedPrefix}/{normalizedAssetPath}";
}

static string ComputeSha256Hex(string value)
{
    var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
    return Convert.ToHexString(bytes).ToLowerInvariant();
}

static async Task<int> UpdateExternalReferencesAsync(string connectionString, IReadOnlyDictionary<string, string> mapping)
{
    await using var connection = new NpgsqlConnection(connectionString);
    await connection.OpenAsync();

    await using var transaction = await connection.BeginTransactionAsync();

    var totalUpdated = 0;
    foreach (var (oldValue, newValue) in mapping)
    {
        totalUpdated += await ExecuteScalarUpdateAsync(connection, transaction,
            "UPDATE \"Videogames\" SET \"UrlImg\" = @newValue WHERE \"UrlImg\" = @oldValue;",
            oldValue,
            newValue);

        totalUpdated += await ExecuteScalarUpdateAsync(connection, transaction,
            "UPDATE \"Videogames\" SET \"Images\" = array_replace(\"Images\", @oldValue, @newValue) WHERE @oldValue = ANY(\"Images\");",
            oldValue,
            newValue);

        totalUpdated += await ExecuteScalarUpdateAsync(connection, transaction,
            "UPDATE \"GameContent\" SET \"FrontalUrl\" = @newValue WHERE \"FrontalUrl\" = @oldValue;",
            oldValue,
            newValue);

        totalUpdated += await ExecuteScalarUpdateAsync(connection, transaction,
            "UPDATE \"GameContent\" SET \"BackUrl\" = @newValue WHERE \"BackUrl\" = @oldValue;",
            oldValue,
            newValue);

        totalUpdated += await ExecuteScalarUpdateAsync(connection, transaction,
            "UPDATE \"GameContent\" SET \"RightSideUrl\" = @newValue WHERE \"RightSideUrl\" = @oldValue;",
            oldValue,
            newValue);

        totalUpdated += await ExecuteScalarUpdateAsync(connection, transaction,
            "UPDATE \"GameContent\" SET \"LeftSideUrl\" = @newValue WHERE \"LeftSideUrl\" = @oldValue;",
            oldValue,
            newValue);

        totalUpdated += await ExecuteScalarUpdateAsync(connection, transaction,
            "UPDATE \"GameContent\" SET \"TopSideUrl\" = @newValue WHERE \"TopSideUrl\" = @oldValue;",
            oldValue,
            newValue);

        totalUpdated += await ExecuteScalarUpdateAsync(connection, transaction,
            "UPDATE \"GameContent\" SET \"BottomSideUrl\" = @newValue WHERE \"BottomSideUrl\" = @oldValue;",
            oldValue,
            newValue);
    }

    await transaction.CommitAsync();
    return totalUpdated;
}

static async Task<int> ExecuteScalarUpdateAsync(
    NpgsqlConnection connection,
    NpgsqlTransaction transaction,
    string sql,
    string oldValue,
    string newValue)
{
    await using var command = new NpgsqlCommand(sql, connection, transaction);
    command.Parameters.AddWithValue("oldValue", oldValue);
    command.Parameters.AddWithValue("newValue", newValue);
    return await command.ExecuteNonQueryAsync();
}

static async Task<List<string>> LoadMissingReferencesFromCsvAsync(string csvPath)
{
    var lines = await File.ReadAllLinesAsync(csvPath);
    var results = new List<string>(Math.Max(lines.Length - 1, 0));

    foreach (var line in lines.Skip(1))
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            continue;
        }

        var reference = line.Split(',', 2, StringSplitOptions.TrimEntries)[0].Trim();
        if (string.IsNullOrWhiteSpace(reference))
        {
            continue;
        }

        if (reference.Length >= 2 && reference[0] == '"' && reference[^1] == '"')
        {
            reference = reference[1..^1].Replace("\"\"", "\"");
        }

        results.Add(reference);
    }

    return results;
}

static string? FindSourceFile(string sourceDirectory, string reference)
{
    var sanitizedReference = reference.Replace('\\', Path.DirectorySeparatorChar)
        .Replace('/', Path.DirectorySeparatorChar)
        .TrimStart(Path.DirectorySeparatorChar);

    var byReferencePath = Path.Combine(sourceDirectory, sanitizedReference);
    if (File.Exists(byReferencePath))
    {
        return byReferencePath;
    }

    var byFileName = Path.Combine(sourceDirectory, Path.GetFileName(reference));
    if (File.Exists(byFileName))
    {
        return byFileName;
    }

    return null;
}

static string GetContentTypeFromExtension(string extension)
{
    return extension.ToLowerInvariant() switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".webp" => "image/webp",
        ".gif" => "image/gif",
        ".avif" => "image/avif",
        _ => "application/octet-stream",
    };
}

static async Task WriteRecoveryCsvAsync(string path, IReadOnlyList<RecoveryResult> results)
{
    var sb = new StringBuilder();
    sb.AppendLine("reference,status,source_file,error");

    foreach (var result in results)
    {
        sb.AppendLine(
            string.Create(
                CultureInfo.InvariantCulture,
                $"{CsvEscape(result.Reference)},{result.Status},{CsvEscape(result.SourceFile)},{CsvEscape(result.ErrorMessage)}"));
    }

    await File.WriteAllTextAsync(path, sb.ToString());
}

static async Task WriteExternalMigrationCsvAsync(string path, IReadOnlyList<ExternalMigrationResult> results)
{
    var sb = new StringBuilder();
    sb.AppendLine("source_url,target_key,status,error");

    foreach (var result in results)
    {
        sb.AppendLine(
            string.Create(
                CultureInfo.InvariantCulture,
                $"{CsvEscape(result.SourceUrl)},{CsvEscape(result.TargetKey)},{result.Status},{CsvEscape(result.ErrorMessage)}"));
    }

    await File.WriteAllTextAsync(path, sb.ToString());
}

static async Task WriteFrontendAssetsSyncCsvAsync(string path, IReadOnlyList<FrontendAssetsSyncResult> results)
{
    var sb = new StringBuilder();
    sb.AppendLine("asset_path,target_key,status,error");

    foreach (var result in results)
    {
        sb.AppendLine(
            string.Create(
                CultureInfo.InvariantCulture,
                $"{CsvEscape(result.AssetPath)},{CsvEscape(result.TargetKey)},{result.Status},{CsvEscape(result.ErrorMessage)}"));
    }

    await File.WriteAllTextAsync(path, sb.ToString());
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
    Recover,
    MigrateExternal,
    SyncFrontendAssets,
}

enum ExternalMigrationStatus
{
    PlannedDryRun,
    Uploaded,
    FailedDownload,
    FailedUpload,
    SkippedHostFilter,
}

enum FrontendAssetsSyncStatus
{
    AlreadyPresent,
    PlannedDryRun,
    Uploaded,
    FailedUpload,
    MissingLocalFile,
}

enum RecoveryStatus
{
    AlreadyPresent,
    RecoveredDryRun,
    Recovered,
    MissingSource,
    Failed,
}

readonly record struct RecoveryResult(string Reference, RecoveryStatus Status, string SourceFile, string ErrorMessage);

readonly record struct RecoveryReport(
    DateTime GeneratedAtUtc,
    string BucketName,
    string SourceDirectory,
    string MissingCsvPath,
    bool IsDryRun,
    int TotalReferences,
    int AlreadyPresentCount,
    int RecoveredCount,
    int MissingSourceCount,
    int FailedCount,
    IReadOnlyList<RecoveryResult> Results);

readonly record struct ExternalMigrationResult(
    string SourceUrl,
    string TargetKey,
    ExternalMigrationStatus Status,
    string ErrorMessage);

readonly record struct ExternalMigrationReport(
    DateTime GeneratedAtUtc,
    string BucketName,
    string KeyPrefix,
    bool IsDryRun,
    int DistinctExternalUrls,
    int PlannedCount,
    int UploadedCount,
    int FailedDownloadCount,
    int FailedUploadCount,
    int SkippedHostCount,
    int DbUpdatedRows,
    IReadOnlyList<ExternalMigrationResult> Results);

readonly record struct FrontendAssetsSyncResult(
    string AssetPath,
    string TargetKey,
    FrontendAssetsSyncStatus Status,
    string ErrorMessage);

readonly record struct FrontendAssetsSyncReport(
    DateTime GeneratedAtUtc,
    string BucketName,
    string Prefix,
    bool IsDryRun,
    int LocalAssetsCount,
    int AlreadyPresentCount,
    int PlannedUploadsCount,
    int UploadedCount,
    int FailedUploadsCount,
    IReadOnlyList<FrontendAssetsSyncResult> Results);

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
    public required string RecoverySourceDirectory { get; init; }
    public required string RecoveryMissingCsvPath { get; init; }
    public required bool RecoveryDryRun { get; init; }
    public required string ExternalMigrationKeyPrefix { get; init; }
    public required IReadOnlySet<string> ExternalMigrationAllowedHosts { get; init; }
    public required bool ExternalMigrationDryRun { get; init; }
    public required string FrontendAssetsSyncPrefix { get; init; }
    public required bool FrontendAssetsSyncDryRun { get; init; }

    public static AuditOptions FromEnvironment()
    {
        var mode = ParseMode(Environment.GetEnvironmentVariable("AUDIT_MODE"));
        var currentDirectory = Directory.GetCurrentDirectory();
        var defaultFrontendRoot = Path.Combine(currentDirectory, "Videogames.Web");

        return new AuditOptions
        {
            Mode = mode,
            ConnectionString = mode is AuditMode.All or AuditMode.Storage
                or AuditMode.MigrateExternal
                ? RequireEnv("AUDIT_DB_CONNECTION_STRING")
                : string.Empty,
            Endpoint = mode is AuditMode.All or AuditMode.Storage or AuditMode.Recover
                or AuditMode.MigrateExternal
                or AuditMode.SyncFrontendAssets
                ? RequireEnv("AUDIT_MINIO_ENDPOINT")
                : string.Empty,
            User = mode is AuditMode.All or AuditMode.Storage or AuditMode.Recover
                or AuditMode.MigrateExternal
                or AuditMode.SyncFrontendAssets
                ? RequireEnv("AUDIT_MINIO_USER")
                : string.Empty,
            Secret = mode is AuditMode.All or AuditMode.Storage or AuditMode.Recover
                or AuditMode.MigrateExternal
                or AuditMode.SyncFrontendAssets
                ? RequireEnv("AUDIT_MINIO_SECRET")
                : string.Empty,
            BucketName = mode is AuditMode.All or AuditMode.Storage or AuditMode.Recover
                or AuditMode.MigrateExternal
                or AuditMode.SyncFrontendAssets
                ? RequireEnv("AUDIT_MINIO_BUCKET")
                : string.Empty,
            Region = mode is AuditMode.All or AuditMode.Storage or AuditMode.Recover
                or AuditMode.MigrateExternal
                or AuditMode.SyncFrontendAssets
                ? Environment.GetEnvironmentVariable("AUDIT_MINIO_REGION") ?? "us-east-1"
                : string.Empty,
            UseSsl = bool.TryParse(Environment.GetEnvironmentVariable("AUDIT_MINIO_USE_SSL"), out var useSsl) && useSsl,
            OutputDirectory = Environment.GetEnvironmentVariable("AUDIT_OUTPUT_DIR")
                ?? Path.Combine(Directory.GetCurrentDirectory(), "audit-output")
            ,
            FrontendPublicDirectory = Environment.GetEnvironmentVariable("AUDIT_FRONTEND_PUBLIC_DIR")
                ?? Path.Combine(defaultFrontendRoot, "public"),
            FrontendSourceDirectory = Environment.GetEnvironmentVariable("AUDIT_FRONTEND_SOURCE_DIR")
                ?? Path.Combine(defaultFrontendRoot, "src"),
            RecoverySourceDirectory = Environment.GetEnvironmentVariable("AUDIT_RECOVERY_SOURCE_DIR")
                ?? string.Empty,
            RecoveryMissingCsvPath = Environment.GetEnvironmentVariable("AUDIT_RECOVERY_MISSING_CSV")
                ?? Path.Combine(Directory.GetCurrentDirectory(), "audit-output", "missing-image-references.csv"),
            RecoveryDryRun = !bool.TryParse(Environment.GetEnvironmentVariable("AUDIT_RECOVERY_APPLY"), out var apply) || !apply,
            ExternalMigrationKeyPrefix = Environment.GetEnvironmentVariable("AUDIT_EXTERNAL_KEY_PREFIX") ?? "external",
            ExternalMigrationAllowedHosts = ParseCsvSet(Environment.GetEnvironmentVariable("AUDIT_EXTERNAL_ALLOWED_HOSTS")),
            ExternalMigrationDryRun = !bool.TryParse(Environment.GetEnvironmentVariable("AUDIT_EXTERNAL_MIGRATION_APPLY"), out var externalApply) || !externalApply,
            FrontendAssetsSyncPrefix = Environment.GetEnvironmentVariable("AUDIT_ASSETS_SYNC_PREFIX") ?? string.Empty,
            FrontendAssetsSyncDryRun = !bool.TryParse(Environment.GetEnvironmentVariable("AUDIT_ASSETS_SYNC_APPLY"), out var assetsApply) || !assetsApply,
        };
    }

    private static AuditMode ParseMode(string? rawMode)
    {
        return rawMode?.Trim().ToLowerInvariant() switch
        {
            null or "" or "all" => AuditMode.All,
            "storage" => AuditMode.Storage,
            "frontend-assets" => AuditMode.FrontendAssets,
            "recover" => AuditMode.Recover,
            "migrate-external" => AuditMode.MigrateExternal,
            "sync-frontend-assets" => AuditMode.SyncFrontendAssets,
            _ => throw new InvalidOperationException(
                "Environment variable 'AUDIT_MODE' must be one of: all, storage, frontend-assets, recover, migrate-external, sync-frontend-assets.")
        };
    }

    private static IReadOnlySet<string> ParseCsvSet(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        }

        return raw
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
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
