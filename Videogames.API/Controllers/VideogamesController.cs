using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Videogames.Application.DTOs;
using Videogames.Application.Services;

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
    public async Task<ActionResult<VideogameDto>> Create(CreateVideogameDto createDto)
    {
        _logger.LogInformation("Creating new videogame: {Name}", createDto.EnglishName);
        var created = await _service.CreateAsync(createDto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<VideogameDto>> GetById(Guid id)
    {
        var videogame = await _service.GetByIdAsync(id);
        if (videogame == null)
        {
            return NotFound();
        }
        return Ok(videogame);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VideogameDto>>> GetAll()
    {
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
