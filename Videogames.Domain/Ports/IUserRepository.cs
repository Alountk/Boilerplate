using Videogames.Domain.Entities;

namespace Videogames.Domain.Ports;

public interface IUserRepository
{
    Task<User> CreateAsync(User user);
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByOAuthAsync(string provider, string subject);
    Task<IEnumerable<User>> GetAllAsync();
    Task<bool> EmailExistsAsync(string email);
    Task UpdateAsync(User user);
    Task DeleteAsync(Guid id);
}
