using Videogames.Domain.Entities;
using Videogames.Domain.Ports;

namespace Videogames.Infrastructure.Repositories;

public class InMemoryVideogameRepository : IVideogameRepository
{
    private readonly List<Videogame> _videogames = new();

    public Task<Videogame> CreateAsync(Videogame videogame)
    {
        _videogames.Add(videogame);
        return Task.FromResult(videogame);
    }

    public Task<Videogame?> GetByIdAsync(Guid id)
    {
        var videogame = _videogames.FirstOrDefault(v => v.Id == id);
        return Task.FromResult(videogame);
    }

    public Task<IEnumerable<Videogame>> GetAllAsync()
    {
        return Task.FromResult(_videogames.AsEnumerable());
    }

    public Task<(IEnumerable<Videogame> Items, int TotalCount)> GetPagedAsync(int page, int pageSize)
    {
        var ordered = _videogames.AsEnumerable().Reverse();
        var totalCount = _videogames.Count;
        var items = ordered.Skip((page - 1) * pageSize).Take(pageSize);
        return Task.FromResult((items, totalCount));
    }

    public Task UpdateAsync(Videogame videogame)
    {
        var index = _videogames.FindIndex(v => v.Id == videogame.Id);
        if (index != -1)
        {
            _videogames[index] = videogame;
        }
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id)
    {
        var videogame = _videogames.FirstOrDefault(v => v.Id == id);
        if (videogame != null)
        {
            _videogames.Remove(videogame);
        }
        return Task.CompletedTask;
    }
}
