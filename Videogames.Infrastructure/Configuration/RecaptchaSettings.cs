namespace Videogames.Infrastructure.Configuration;

public class RecaptchaSettings
{
    public const string SectionName = "Recaptcha";
    public string SiteKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
}
