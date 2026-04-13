using Microsoft.EntityFrameworkCore;
using Videogames.Domain.Entities;
using Videogames.Domain.Ports;
using Videogames.Infrastructure.Persistence;

namespace Videogames.Infrastructure.Repositories;

public class PostgresUserRepository : IUserRepository
{
    private readonly VideogamesDbContext _context;

    public PostgresUserRepository(VideogamesDbContext context)
    {
        _context = context;
    }

    public async Task<User> CreateAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        var lowerEmail = email.ToLower();
        var users = await _context.Users.ToListAsync();
        return users.FirstOrDefault(u => u.Email.Value == lowerEmail);
    }

    public async Task<User?> GetByOAuthAsync(string provider, string subject)
    {
        var users = await _context.Users.ToListAsync();
        return users.FirstOrDefault(u =>
            u.OAuthProvider == provider && u.OAuthSubject == subject);
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        return await _context.Users.ToListAsync();
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        var lowerEmail = email.ToLower();
        var users = await _context.Users.ToListAsync();
        return users.Any(u => u.Email.Value == lowerEmail);
    }

    public async Task UpdateAsync(User user)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var user = await GetByIdAsync(id);
        if (user != null)
        {
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
        }
    }
}
