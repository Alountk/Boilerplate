using System.ComponentModel.DataAnnotations;

namespace Videogames.Application.DTOs;

public record UserDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string Address,
    string City,
    string Country,
    string Phone,
    bool EmailVerified,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
