namespace Videogames.Application.Services;

using Videogames.Application.DTOs;

public interface IUserService
{
    Task<AuthResponseDto> CreateAsync(CreateUserDto createDto);
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    Task<AuthResponseDto> OAuthLoginAsync(string provider, OAuthLoginDto dto);
    Task<UserDto?> GetByIdAsync(Guid id);
    Task<UserDto?> GetByEmailAsync(string email);
    Task<IEnumerable<UserDto>> GetAllAsync();
    Task<UserDto> UpdateAsync(Guid id, UpdateUserDto updateDto);
    Task DeleteAsync(Guid id);
}
