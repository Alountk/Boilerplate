using Videogames.Domain.Entities;

namespace Videogames.Domain.Ports;

public interface IVideogameRepository
{
    Task<Videogame> CreateAsync(Videogame videogame);
    Task<Videogame?> GetByIdAsync(Guid id);
    Task<IEnumerable<Videogame>> GetAllAsync();
    Task<(IEnumerable<Videogame> Items, int TotalCount)> GetPagedAsync(int page, int pageSize);
    Task<(IEnumerable<Videogame> Items, int TotalCount)> GetBySellerIdAsync(Guid sellerId, int page, int pageSize);
    Task UpdateAsync(Videogame videogame);
    Task DeleteAsync(Guid id);
}
