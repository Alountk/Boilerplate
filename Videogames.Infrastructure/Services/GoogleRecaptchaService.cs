using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Videogames.Application.Services;
using Videogames.Infrastructure.Configuration;

namespace Videogames.Infrastructure.Services;

public class GoogleRecaptchaService : IRecaptchaService
{
    private readonly HttpClient _httpClient;
    private readonly RecaptchaSettings _settings;
    private readonly ILogger<GoogleRecaptchaService> _logger;
    private const string GoogleVerifyUrl = "https://www.google.com/recaptcha/api/siteverify";

    public GoogleRecaptchaService(
        HttpClient httpClient,
        IOptions<RecaptchaSettings> settings,
        ILogger<GoogleRecaptchaService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<bool> VerifyTokenAsync(string token)
    {
        if (string.IsNullOrEmpty(token))
        {
            _logger.LogWarning("Recaptcha token is missing.");
            return false;
        }

        try
        {
            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("secret", _settings.SecretKey),
                new KeyValuePair<string, string>("response", token)
            });

            var response = await _httpClient.PostAsync(GoogleVerifyUrl, content);
            response.EnsureSuccessStatusCode();

            var googleResponse = await response.Content.ReadFromJsonAsync<GoogleRecaptchaResponse>();
            
            if (googleResponse?.Success == true)
            {
                return true;
            }
            
            _logger.LogWarning("Recaptcha verification failed. Errors: {Errors}", 
                googleResponse?.ErrorCodes != null ? string.Join(", ", googleResponse.ErrorCodes) : "None");
                
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying recaptcha token.");
            return false;
        }
    }

    private class GoogleRecaptchaResponse
    {
        [System.Text.Json.Serialization.JsonPropertyName("success")]
        public bool Success { get; set; }
        
        [System.Text.Json.Serialization.JsonPropertyName("error-codes")]
        public string[]? ErrorCodes { get; set; }
    }
}
