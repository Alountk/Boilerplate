namespace Videogames.Application.Services;

public interface IRegistrationVerificationService
{
    Task SendCodeAsync(string email);
    Task<bool> ConfirmCodeAsync(string email, string code);
}
