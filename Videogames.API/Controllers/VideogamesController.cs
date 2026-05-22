using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Videogames.Application.DTOs;
using Videogames.Application.Services;
using Videogames.API.Attributes;
using System.Security.Claims;

namespace Videogames.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VideogamesController : ControllerBase
{
    private readonly IVideogameService _service;
    private readonly ILogger<VideogamesController> _logger;

    public VideogamesController(IVideogameService service, ILogger<VideogamesController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost]
    [RequireEmailVerified]
    public async Task<ActionResult<VideogameDto>> Create(CreateVideogameDto createDto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Creating new videogame: {Name} for User: {UserId}", createDto.EnglishName, userId);
        var created = await _service.CreateAsync(createDto, userId);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<VideogameDto>> GetById(Guid id)
    {
        var videogame = await _service.GetByIdAsync(id);
        if (videogame == null)
        {
            return NotFound();
        }
        return Ok(videogame);
    }

    [HttpGet("seller/my-items")]
    public async Task<ActionResult> GetMyItems([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Fetching items for seller: {SellerId}", userId);
        var paged = await _service.GetBySellerIdAsync(userId, page, pageSize);
        return Ok(paged);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult> GetAll([FromQuery] int? page, [FromQuery] int pageSize = 12)
    {
        if (page.HasValue)
        {
            var paged = await _service.GetPagedAsync(page.Value, pageSize);
            return Ok(paged);
        }

        var videogames = await _service.GetAllAsync();
        return Ok(videogames);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UpdateVideogameDto updateDto)
    {
        _logger.LogInformation("Updating videogame: {Id}", id);
        await _service.UpdateAsync(id, updateDto);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        _logger.LogInformation("Deleting videogame: {Id}", id);
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
