using Videogames.Application.DTOs;
using Videogames.Application.Security;
using Videogames.Domain.Entities;
using Videogames.Domain.Ports;
using Videogames.Domain.ValueObjects;

namespace Videogames.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _repository;
    private readonly ITokenService _tokenService;

    public UserService(IUserRepository repository, ITokenService tokenService)
    {
        _repository = repository;
        _tokenService = tokenService;
    }

    public async Task<AuthResponseDto> CreateAsync(CreateUserDto createDto)
    {
        // Check if email already exists
        if (await _repository.EmailExistsAsync(createDto.Email))
        {
            throw new InvalidOperationException($"A user with email '{createDto.Email}' already exists");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = createDto.FirstName,
            LastName = createDto.LastName,
            Email = Email.Create(createDto.Email),
            PasswordHash = PasswordHasher.HashPassword(createDto.Password),
            Address = createDto.Address ?? string.Empty,
            City = createDto.City ?? string.Empty,
            Country = createDto.Country ?? string.Empty,
            Phone = createDto.Phone ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(user);
        var persistedUser = created ?? user;
        var token = _tokenService.GenerateToken(persistedUser);

        return new AuthResponseDto(token, MapToDto(persistedUser));
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        var user = await _repository.GetByEmailAsync(loginDto.Email);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        if (!PasswordHasher.VerifyPassword(loginDto.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        var token = _tokenService.GenerateToken(user);
        return new AuthResponseDto(token, MapToDto(user));
    }

    public async Task<UserDto?> GetByIdAsync(Guid id)
    {
        var user = await _repository.GetByIdAsync(id);
        return user == null ? null : MapToDto(user);
    }

    public async Task<UserDto?> GetByEmailAsync(string email)
    {
        var user = await _repository.GetByEmailAsync(email);
        return user == null ? null : MapToDto(user);
    }

    public async Task<IEnumerable<UserDto>> GetAllAsync()
    {
        var users = await _repository.GetAllAsync();
        return users.Select(MapToDto);
    }

    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserDto updateDto)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing == null)
        {
            throw new InvalidOperationException($"User with ID '{id}' not found");
        }

        // Check if email is being changed and if it already exists
        if (!string.IsNullOrWhiteSpace(updateDto.Email) && 
            updateDto.Email != existing.Email.Value)
        {
            if (await _repository.EmailExistsAsync(updateDto.Email))
            {
                throw new InvalidOperationException($"A user with email '{updateDto.Email}' already exists");
            }
            existing.Email = Email.Create(updateDto.Email);
        }

        // Update fields if provided
        if (!string.IsNullOrWhiteSpace(updateDto.FirstName))
            existing.FirstName = updateDto.FirstName;

        if (!string.IsNullOrWhiteSpace(updateDto.LastName))
            existing.LastName = updateDto.LastName;

        if (!string.IsNullOrWhiteSpace(updateDto.Password))
            existing.PasswordHash = PasswordHasher.HashPassword(updateDto.Password);

        if (updateDto.Address != null)
            existing.Address = updateDto.Address;

        if (updateDto.City != null)
            existing.City = updateDto.City;

        if (updateDto.Country != null)
            existing.Country = updateDto.Country;

        if (updateDto.Phone != null)
            existing.Phone = updateDto.Phone;

        existing.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(existing);
        return MapToDto(existing);
    }

    public async Task DeleteAsync(Guid id)
    {
        await _repository.DeleteAsync(id);
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email.Value,
            user.Address,
            user.City,
            user.Country,
            user.Phone,
            user.CreatedAt,
            user.UpdatedAt
        );
    }
}
