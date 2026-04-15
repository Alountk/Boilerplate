using Videogames.Application.DTOs;
using Videogames.Application.Security;
using Videogames.Domain.Entities;
using Videogames.Domain.Ports;
using Videogames.Domain.ValueObjects;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;

namespace Videogames.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _repository;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;

    public UserService(IUserRepository repository, ITokenService tokenService, IConfiguration configuration)
    {
        _repository = repository;
        _tokenService = tokenService;
        _configuration = configuration;
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

    public async Task<AuthResponseDto> OAuthLoginAsync(string provider, OAuthLoginDto dto)
    {
        string email;
        string subject;
        string firstName = string.Empty;
        string lastName = string.Empty;

        if (provider == "google")
        {
            // Use Google's userinfo endpoint to exchange access_token for user info
            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", dto.IdToken);
            var response = await httpClient.GetAsync("https://www.googleapis.com/userinfo/v2/me");
            if (!response.IsSuccessStatusCode)
                throw new UnauthorizedAccessException("Invalid Google access token");

            var content = await response.Content.ReadAsStringAsync();
            var userInfo = JsonDocument.Parse(content).RootElement;

            email = userInfo.GetProperty("email").GetString()
                ?? throw new UnauthorizedAccessException("Google token missing email");
            subject = userInfo.GetProperty("id").GetString()
                ?? throw new UnauthorizedAccessException("Google token missing id");
            firstName = userInfo.TryGetProperty("given_name", out var fn) ? fn.GetString() ?? string.Empty : string.Empty;
            lastName = userInfo.TryGetProperty("family_name", out var ln) ? ln.GetString() ?? string.Empty : string.Empty;
        }
        else if (provider == "apple")
        {
            var (appleEmail, appleSubject) = await ValidateAppleTokenAsync(dto.IdToken);
            email = appleEmail;
            subject = appleSubject;
        }
        else
        {
            throw new ArgumentException($"Unsupported OAuth provider: {provider}");
        }

        // Find by OAuth subject first (most reliable)
        var user = await _repository.GetByOAuthAsync(provider, subject);

        if (user == null)
        {
            // Try to link to existing account by email
            user = await _repository.GetByEmailAsync(email);

            if (user == null)
            {
                // Create new user
                user = new User
                {
                    Id = Guid.NewGuid(),
                    FirstName = firstName,
                    LastName = lastName,
                    Email = Email.Create(email),
                    PasswordHash = string.Empty,
                    OAuthProvider = provider,
                    OAuthSubject = subject,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                user = await _repository.CreateAsync(user);
            }
            else
            {
                // Link OAuth to existing account
                user.OAuthProvider = provider;
                user.OAuthSubject = subject;
                user.UpdatedAt = DateTime.UtcNow;
                await _repository.UpdateAsync(user);
            }
        }

        var token = _tokenService.GenerateToken(user);
        return new AuthResponseDto(token, MapToDto(user));
    }

    private async Task<(string Email, string Subject)> ValidateAppleTokenAsync(string idToken)
    {
        // Fetch Apple's public keys
        using var httpClient = new HttpClient();
        var keysJson = await httpClient.GetStringAsync("https://appleid.apple.com/auth/keys");
        var keys = JsonDocument.Parse(keysJson).RootElement.GetProperty("keys");

        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(idToken);
        var kid = jwtToken.Header["kid"]?.ToString()
            ?? throw new SecurityTokenException("Apple token missing kid");

        JsonElement? matchingKey = null;
        foreach (var key in keys.EnumerateArray())
        {
            if (key.GetProperty("kid").GetString() == kid)
            {
                matchingKey = key;
                break;
            }
        }

        if (matchingKey == null)
            throw new SecurityTokenException("Apple public key not found");

        var rsaParams = new RSAParameters
        {
            Modulus = Base64UrlEncoder.DecodeBytes(matchingKey.Value.GetProperty("n").GetString()!),
            Exponent = Base64UrlEncoder.DecodeBytes(matchingKey.Value.GetProperty("e").GetString()!)
        };
        var rsa = RSA.Create();
        rsa.ImportParameters(rsaParams);
        var rsaSecurityKey = new RsaSecurityKey(rsa);

        var teamId = _configuration["Apple:TeamId"]
            ?? throw new InvalidOperationException("Apple TeamId not configured");
        var clientId = _configuration["Apple:ClientId"]
            ?? throw new InvalidOperationException("Apple ClientId not configured");

        handler.ValidateToken(idToken, new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "https://appleid.apple.com",
            ValidateAudience = true,
            ValidAudience = clientId,
            ValidateLifetime = true,
            IssuerSigningKey = rsaSecurityKey
        }, out var validatedToken);

        var jwt = (JwtSecurityToken)validatedToken;
        var email = jwt.Claims.FirstOrDefault(c => c.Type == "email")?.Value
            ?? throw new SecurityTokenException("Apple token missing email claim");
        var subject = jwt.Subject
            ?? throw new SecurityTokenException("Apple token missing sub claim");

        return (email, subject);
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
