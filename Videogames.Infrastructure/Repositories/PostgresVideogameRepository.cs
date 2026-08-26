using Microsoft.EntityFrameworkCore;
using Videogames.Domain.Entities;
using Videogames.Domain.Ports;
using Videogames.Infrastructure.Persistence;

namespace Videogames.Infrastructure.Repositories;

public class PostgresVideogameRepository : IVideogameRepository
{
    private readonly VideogamesDbContext _context;

    public PostgresVideogameRepository(VideogamesDbContext context)
    {
        _context = context;
    }

    public async Task<Videogame> CreateAsync(Videogame videogame)
    {
        _context.Videogames.Add(videogame);
        await _context.SaveChangesAsync();
        return videogame;
    }

    public async Task<Videogame?> GetByIdAsync(Guid id)
    {
        return await _context.Videogames
            .Include(v => v.Names) // Eager load owned collection
            .FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<IEnumerable<Videogame>> GetAllAsync()
    {
        return await _context.Videogames
            .Include(v => v.Names)
            .ToListAsync();
    }

    public async Task<(IEnumerable<Videogame> Items, int TotalCount)> GetPagedAsync(int page, int pageSize)
    {
        var query = _context.Videogames
            .Include(v => v.Names)
            .OrderByDescending(v => v.Id);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<(IEnumerable<Videogame> Items, int TotalCount)> GetBySellerIdAsync(Guid sellerId, int page, int pageSize)
    {
        var query = _context.Videogames
            .Where(v => v.SellerId == sellerId)
            .Include(v => v.Names)
            .OrderByDescending(v => v.Id);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task UpdateAsync(Videogame videogame)
    {
        _context.Entry(videogame).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var videogame = await _context.Videogames.FindAsync(id);
        if (videogame != null)
        {
            _context.Videogames.Remove(videogame);
            await _context.SaveChangesAsync();
        }
    }
}
