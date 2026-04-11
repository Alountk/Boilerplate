using Videogames.Application.DTOs;

namespace Videogames.Application.Services;

public interface IVideogameService
{
    Task<VideogameDto> CreateAsync(CreateVideogameDto createDto, Guid sellerId);
    Task<VideogameDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<VideogameDto>> GetAllAsync();
    Task UpdateAsync(Guid id, UpdateVideogameDto updateDto);
    Task DeleteAsync(Guid id);
}
