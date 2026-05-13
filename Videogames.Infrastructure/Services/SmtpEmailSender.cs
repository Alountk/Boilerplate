using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Videogames.Application.Services;

namespace Videogames.Infrastructure.Services;

public sealed class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string body)
    {
        var host = _configuration["Smtp:Host"];
        var from = _configuration["Smtp:From"];
        var user = _configuration["Smtp:User"];
        var password = _configuration["Smtp:Password"];

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
        {
            _logger.LogWarning(
                "SMTP is not configured. Verification code email for {Email} was not sent over SMTP.",
                toEmail);
            return;
        }

        var port = int.TryParse(_configuration["Smtp:Port"], out var parsedPort) ? parsedPort : 587;
        var enableSsl = !bool.TryParse(_configuration["Smtp:EnableSsl"], out var parsedEnableSsl) || parsedEnableSsl;

        using var message = new MailMessage(from, toEmail, subject, body);
        using var client = new SmtpClient(host, port)
        {
            EnableSsl = enableSsl,
        };

        if (!string.IsNullOrWhiteSpace(user) && !string.IsNullOrWhiteSpace(password))
        {
            client.Credentials = new NetworkCredential(user, password);
        }

        await client.SendMailAsync(message);
        _logger.LogInformation("Verification code email sent to {Email}", toEmail);
    }
}
