using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Videogames.Application.DTOs;
using Videogames.Application.Services;

namespace Videogames.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IUserService service, 
        ILogger<UsersController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<UserDto>> Create(CreateUserDto createDto)
    {
        try
        {


            _logger.LogInformation("Creating new user");
            var created = await _service.CreateAsync(createDto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to create user: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, new { error = "An error occurred while creating the user" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var user = await _service.GetByIdAsync(id);
        if (user == null)
        {
            return NotFound();
        }
        return Ok(user);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        var users = await _service.GetAllAsync();
        return Ok(users);
    }

    [HttpGet("email/{email}")]
    public async Task<ActionResult<UserDto>> GetByEmail(string email)
    {
        var user = await _service.GetByEmailAsync(email);
        if (user == null)
        {
            return NotFound();
        }
        return Ok(user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UpdateUserDto updateDto)
    {
        try
        {
            _logger.LogInformation("Updating user: {Id}", id);
            await _service.UpdateAsync(id, updateDto);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to update user {Id}: {Message}", id, ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {Id}", id);
            return StatusCode(500, new { error = "An error occurred while updating the user" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        _logger.LogInformation("Deleting user: {Id}", id);
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
