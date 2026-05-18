using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Videogames.Application.DTOs;
using Videogames.Application.Services;
using Microsoft.AspNetCore.Http;
using System;
using System.Threading.Tasks;

namespace Videogames.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImagesController : ControllerBase
{
    private const long MaxUploadSizeBytes = 5 * 1024 * 1024;

    private readonly IImageService _imageService;
    private readonly ILogger<ImagesController> _logger;

    public ImagesController(IImageService imageService, ILogger<ImagesController> logger)
    {
        _imageService = imageService;
        _logger = logger;
    }

    [HttpPost("presigned-upload")]
    public async Task<IActionResult> CreatePresignedUpload([FromBody] CreatePresignedUploadRequestDto request)
    {
        if (request is null)
        {
            return BadRequest("Request body is required.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var result = await _imageService.CreatePresignedUploadAsync(request.ContentType, request.SizeBytes);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating presigned upload URL");
            return StatusCode(500, "Internal server error during presigned upload URL generation.");
        }
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        if (file.Length > MaxUploadSizeBytes)
        {
            return BadRequest($"File size exceeds allowed limit of {MaxUploadSizeBytes} bytes.");
        }

        try
        {
            _logger.LogWarning(
                "Legacy endpoint /api/Images/upload is deprecated and was used for file {FileName}. Prefer /api/Images/presigned-upload.",
                file.FileName
            );
            _logger.LogInformation("Uploading image: {FileName}, ContentType: {ContentType}", file.FileName, file.ContentType);

            using var stream = file.OpenReadStream();
            var fileName = await _imageService.UploadImageAsync(stream, file.ContentType);

            return Ok(new { fileName });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image");
            return StatusCode(500, "Internal server error during image upload.");
        }
    }

    [HttpGet("{fileName}/metadata")]
    [AllowAnonymous]
    public async Task<IActionResult> GetImageMetadata(string fileName)
    {
        try
        {
            var metadata = await _imageService.GetImageMetadataAsync(fileName);
            return Ok(metadata);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving image metadata {FileName}", fileName);
            return NotFound();
        }
    }

    [HttpGet("{fileName}")]
    [AllowAnonymous] // Allow public access to images
    public async Task<IActionResult> GetImage(string fileName)
    {
        try
        {
            var url = await _imageService.GetImageUrlAsync(fileName);
            return Redirect(url);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving image url {FileName}", fileName);
            return NotFound();
        }
    }

    [HttpPost("upload-minio")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        if (file.Length > MaxUploadSizeBytes)
        {
            return BadRequest($"File size exceeds allowed limit of {MaxUploadSizeBytes} bytes.");
        }

        try
        {
            _logger.LogWarning(
                "Legacy endpoint /api/Images/upload-minio is deprecated and was used for file {FileName}. Prefer /api/Images/presigned-upload.",
                file.FileName
            );

            using var stream = file.OpenReadStream();
            var fileName = await _imageService.UploadImageAsync(stream, file.ContentType);
            var fileUrl = await _imageService.GetImageUrlAsync(fileName);

            return Ok(new { Url = fileUrl, fileName });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image in legacy /upload-minio endpoint");
            return StatusCode(500, new { Error = ex.Message });
        }
    }
}
