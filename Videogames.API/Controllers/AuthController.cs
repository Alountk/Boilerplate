using Microsoft.AspNetCore.Mvc;
using Videogames.Application.DTOs;
using Videogames.Application.Services;

namespace Videogames.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IRegistrationVerificationService _registrationVerificationService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IUserService userService,
        IRegistrationVerificationService registrationVerificationService,
        ILogger<AuthController> logger)
    {
        _userService = userService;
        _registrationVerificationService = registrationVerificationService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
    {
        try
        {
            _logger.LogInformation("Login attempt for user: {Email}", loginDto.Email);
            var response = await _userService.LoginAsync(loginDto);
            _logger.LogInformation("Login successful for user: {Email}", loginDto.Email);
            return Ok(response);
        }
        catch (UnauthorizedAccessException)
        {
            _logger.LogWarning("Login failed for user: {Email}", loginDto.Email);
            return Unauthorized(new { error = "Invalid credentials" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for user: {Email} | Exception Type: {ExceptionType} | Message: {Message}",
                loginDto.Email, ex.GetType().Name, ex.Message);

            // Return different error messages based on exception type
            var errorMessage = ex switch
            {
                NullReferenceException => "Configuration error",
                InvalidOperationException => ex.Message.Contains("JWT") ? "Token generation error" : "Login error",
                _ => "An error occurred during login"
            };

            return StatusCode(500, new { error = errorMessage, details = ex.Message });
        }
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponseDto>> GoogleLogin([FromBody] OAuthLoginDto dto)
    {
        try
        {
            _logger.LogInformation("Google OAuth login attempt");
            var response = await _userService.OAuthLoginAsync("google", dto);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Invalid Google ID token: {Message}", ex.Message);
            return Unauthorized(new { error = "Invalid Google token" });
        }
        catch (Exception ex) when (ex.GetType().Name.Contains("InvalidJwt") || ex.Message.Contains("JWT"))
        {
            _logger.LogWarning("Invalid Google ID token: {Message}", ex.Message);
            return Unauthorized(new { error = "Invalid Google token" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google OAuth login");
            return StatusCode(500, new { error = "An error occurred during Google login" });
        }
    }

    [HttpPost("apple")]
    public async Task<ActionResult<AuthResponseDto>> AppleLogin([FromBody] OAuthLoginDto dto)
    {
        try
        {
            _logger.LogInformation("Apple OAuth login attempt");
            var response = await _userService.OAuthLoginAsync("apple", dto);
            return Ok(response);
        }
        catch (Microsoft.IdentityModel.Tokens.SecurityTokenException ex)
        {
            _logger.LogWarning("Invalid Apple ID token: {Message}", ex.Message);
            return Unauthorized(new { error = "Invalid Apple token" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Apple OAuth login");
            return StatusCode(500, new { error = "An error occurred during Apple login" });
        }
    }

    [HttpPost("register-email/send-code")]
    public async Task<IActionResult> SendRegistrationCode([FromBody] SendRegistrationCodeDto dto)
    {
        try
        {
            await _registrationVerificationService.SendCodeAsync(dto.Email);
            return Ok(new { sent = true });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Unable to send registration verification code: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending registration verification code");
            return StatusCode(500, new { error = "An error occurred while sending the verification code" });
        }
    }

    [HttpPost("register-email/confirm")]
    public async Task<IActionResult> ConfirmRegistrationCode([FromBody] ConfirmRegistrationCodeDto dto)
    {
        try
        {
            var verified = await _registrationVerificationService.ConfirmCodeAsync(dto.Email, dto.Code);
            if (!verified)
            {
                return BadRequest(new { verified = false, error = "Invalid or expired verification code" });
            }

            await _userService.MarkEmailAsVerifiedAsync(dto.Email);
            return Ok(new { verified = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming registration verification code");
            return StatusCode(500, new { error = "An error occurred while confirming the verification code" });
        }
    }
}
