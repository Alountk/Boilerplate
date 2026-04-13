using System.Collections.Concurrent;
using Videogames.Domain.Entities;
using Videogames.Domain.Ports;

namespace Videogames.Infrastructure.Repositories;

public class InMemoryUserRepository : IUserRepository
{
    private readonly ConcurrentDictionary<Guid, User> _users = new();

    public Task<User> CreateAsync(User user)
    {
        _users[user.Id] = user;
        return Task.FromResult(user);
    }

    public Task<User?> GetByIdAsync(Guid id)
    {
        _users.TryGetValue(id, out var user);
        return Task.FromResult(user);
    }

    public Task<User?> GetByEmailAsync(string email)
    {
        var user = _users.Values
            .FirstOrDefault(u => u.Email.Value.Equals(email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(user);
    }

    public Task<User?> GetByOAuthAsync(string provider, string subject)
    {
        var user = _users.Values
            .FirstOrDefault(u => u.OAuthProvider == provider && u.OAuthSubject == subject);
        return Task.FromResult(user);
    }

    public Task<IEnumerable<User>> GetAllAsync()
    {
        return Task.FromResult<IEnumerable<User>>(_users.Values.ToList());
    }

    public Task<bool> EmailExistsAsync(string email)
    {
        var exists = _users.Values
            .Any(u => u.Email.Value.Equals(email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(exists);
    }

    public Task UpdateAsync(User user)
    {
        _users[user.Id] = user;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id)
    {
        _users.TryRemove(id, out _);
        return Task.CompletedTask;
    }
}
