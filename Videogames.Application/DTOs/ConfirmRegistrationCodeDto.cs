using System.ComponentModel.DataAnnotations;

namespace Videogames.Application.DTOs;

public record ConfirmRegistrationCodeDto(
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    string Email,

    [Required(ErrorMessage = "Verification code is required")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Verification code must have 6 digits")]
    string Code
);
