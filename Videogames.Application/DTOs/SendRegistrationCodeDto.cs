using System.ComponentModel.DataAnnotations;

namespace Videogames.Application.DTOs;

public record SendRegistrationCodeDto(
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    string Email
);
