using Videogames.Application.DTOs;
using Videogames.Domain.Entities;
using Videogames.Domain.Ports;

namespace Videogames.Application.Services;

public class VideogameService : IVideogameService
{
    private readonly IVideogameRepository _repository;

    public VideogameService(IVideogameRepository repository)
    {
        _repository = repository;
    }

    public async Task<VideogameDto> CreateAsync(CreateVideogameDto createDto, Guid sellerId)
    {
        var videogame = new Videogame
        {
            Id = Guid.NewGuid(),
            EnglishName = createDto.EnglishName,
            Names = createDto.Names,
            Qr = createDto.Qr,
            Codebar = createDto.Codebar,
            Console = createDto.Console,
            Assets = createDto.Assets,
            Images = createDto.Images,
            State = createDto.State,
            ReleaseDate = createDto.ReleaseDate,
            VersionGame = createDto.VersionGame,
            Description = createDto.Description,
            UrlImg = createDto.UrlImg,
            GeneralState = createDto.GeneralState,
            AveragePrice = createDto.AveragePrice,
            OwnPrice = createDto.OwnPrice,
            AcceptOffersRange = createDto.AcceptOffersRange,
            Score = createDto.Score,
            Category = createDto.Category,
            Contents = createDto.Contents,
            SellerId = sellerId
        };

        var created = await _repository.CreateAsync(videogame);
        return MapToDto(created);
    }

    public async Task<VideogameDto?> GetByIdAsync(Guid id)
    {
        var videogame = await _repository.GetByIdAsync(id);
        return videogame == null ? null : MapToDto(videogame);
    }

    public async Task<IEnumerable<VideogameDto>> GetAllAsync()
    {
        var videogames = await _repository.GetAllAsync();
        return videogames.Select(MapToDto);
    }

    public async Task<PagedResultDto<VideogameDto>> GetPagedAsync(int page, int pageSize)
    {
        var (items, totalCount) = await _repository.GetPagedAsync(page, pageSize);
        var dtos = items.Select(MapToDto);
        var hasMore = page * pageSize < totalCount;
        return new PagedResultDto<VideogameDto>(dtos, totalCount, page, pageSize, hasMore);
    }

    public async Task<PagedResultDto<VideogameDto>> GetBySellerIdAsync(Guid sellerId, int page, int pageSize)
    {
        var (items, totalCount) = await _repository.GetBySellerIdAsync(sellerId, page, pageSize);
        var dtos = items.Select(MapToDto);
        var hasMore = page * pageSize < totalCount;
        return new PagedResultDto<VideogameDto>(dtos, totalCount, page, pageSize, hasMore);
    }

    public async Task UpdateAsync(Guid id, UpdateVideogameDto updateDto)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing == null)
        {
            // In a real app, we might throw a NotFoundException here
            return;
        }

        existing.EnglishName = updateDto.EnglishName;
        existing.Names = updateDto.Names;
        existing.Qr = updateDto.Qr;
        existing.Codebar = updateDto.Codebar;
        existing.Console = updateDto.Console;
        existing.Assets = updateDto.Assets;
        existing.Images = updateDto.Images;
        existing.State = updateDto.State;
        existing.ReleaseDate = updateDto.ReleaseDate;
        existing.VersionGame = updateDto.VersionGame;
        existing.Description = updateDto.Description;
        existing.UrlImg = updateDto.UrlImg;
        existing.GeneralState = updateDto.GeneralState;
        existing.AveragePrice = updateDto.AveragePrice;
        existing.OwnPrice = updateDto.OwnPrice;
        existing.AcceptOffersRange = updateDto.AcceptOffersRange;
        existing.Score = updateDto.Score;
        existing.Category = updateDto.Category;
        existing.Contents = updateDto.Contents;

        await _repository.UpdateAsync(existing);
    }

    public async Task DeleteAsync(Guid id)
    {
        await _repository.DeleteAsync(id);
    }

    private static VideogameDto MapToDto(Videogame videogame)
    {
        return new VideogameDto(
            videogame.Id,
            videogame.EnglishName,
            videogame.Names,
            videogame.Qr,
            videogame.Codebar,
            videogame.Console,
            videogame.Assets,
            videogame.Images,
            videogame.State,
            videogame.ReleaseDate,
            videogame.VersionGame,
            videogame.Description,
            videogame.UrlImg,
            videogame.GeneralState,
            videogame.AveragePrice,
            videogame.OwnPrice,
            videogame.AcceptOffersRange,
            videogame.Score,
            videogame.Category,
            videogame.Contents
        );
    }
}
