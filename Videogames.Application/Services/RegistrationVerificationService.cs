using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using Videogames.Domain.Ports;

namespace Videogames.Application.Services;

public sealed class RegistrationVerificationService : IRegistrationVerificationService
{
    private static readonly TimeSpan CodeTtl = TimeSpan.FromMinutes(10);
    private static readonly ConcurrentDictionary<string, VerificationCodeEntry> CodesByEmail = new(StringComparer.Ordinal);

    private readonly IUserRepository _userRepository;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<RegistrationVerificationService> _logger;

    public RegistrationVerificationService(
        IUserRepository userRepository,
        IEmailSender emailSender,
        ILogger<RegistrationVerificationService> logger)
    {
        _userRepository = userRepository;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task SendCodeAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _userRepository.GetByEmailAsync(normalizedEmail);
        if (user is null)
        {
            throw new InvalidOperationException("User not found for the provided email");
        }

        var code = Random.Shared.Next(100000, 999999).ToString();
        var cacheKey = BuildCacheKey(normalizedEmail);
        var expiresAtUtc = DateTime.UtcNow.Add(CodeTtl);

        CodesByEmail[cacheKey] = new VerificationCodeEntry(code, expiresAtUtc);

        var subject = "vMarket verification code";
        var body = $"Your verification code is {code}. It expires in {(int)CodeTtl.TotalMinutes} minutes.";

        await _emailSender.SendAsync(normalizedEmail, subject, body);
        _logger.LogInformation("Registration verification code issued for {Email}", normalizedEmail);
    }

    public Task<bool> ConfirmCodeAsync(string email, string code)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var normalizedCode = code.Trim();
        var cacheKey = BuildCacheKey(normalizedEmail);

        if (!CodesByEmail.TryGetValue(cacheKey, out var entry))
        {
            return Task.FromResult(false);
        }

        if (entry.ExpiresAtUtc <= DateTime.UtcNow)
        {
            CodesByEmail.TryRemove(cacheKey, out _);
            return Task.FromResult(false);
        }

        var verified = string.Equals(entry.Code, normalizedCode, StringComparison.Ordinal);
        if (!verified)
        {
            return Task.FromResult(false);
        }

        CodesByEmail.TryRemove(cacheKey, out _);
        _logger.LogInformation("Registration verification code confirmed for {Email}", normalizedEmail);
        return Task.FromResult(true);
    }

    private static string BuildCacheKey(string email)
    {
        return $"registration-verification:{email}";
    }

    private readonly record struct VerificationCodeEntry(string Code, DateTime ExpiresAtUtc);
}
