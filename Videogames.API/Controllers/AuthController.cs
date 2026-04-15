using Microsoft.AspNetCore.Mvc;
using Videogames.Application.DTOs;
using Videogames.Application.Services;

namespace Videogames.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IUserService userService, ILogger<AuthController> logger)
    {
        _userService = userService;
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
            _logger.LogError(ex, "Error during login for user: {Email}", loginDto.Email);
            return StatusCode(500, new { error = "An error occurred during login" });
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
}
