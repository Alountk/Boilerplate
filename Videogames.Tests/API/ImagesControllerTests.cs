using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Videogames.API.Controllers;
using Videogames.Application.DTOs;
using Videogames.Application.Services;

namespace Videogames.Tests.API;

public class ImagesControllerTests
{
    private readonly Mock<IImageService> _imageServiceMock;
    private readonly ImagesController _controller;

    public ImagesControllerTests()
    {
        _imageServiceMock = new Mock<IImageService>();
        var loggerMock = new Mock<ILogger<ImagesController>>();
        _controller = new ImagesController(_imageServiceMock.Object, loggerMock.Object);
    }

    [Fact]
    public async Task CreatePresignedUpload_ShouldReturnOk_WhenRequestIsValid()
    {
        // Arrange
        var request = new CreatePresignedUploadRequestDto("image/png", 1024);
        var response = new PresignedUploadDto("file.png", "https://upload-url", DateTime.UtcNow.AddMinutes(15));

        _imageServiceMock
            .Setup(s => s.CreatePresignedUploadAsync(request.ContentType, request.SizeBytes))
            .ReturnsAsync(response);

        // Act
        var result = await _controller.CreatePresignedUpload(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var payload = Assert.IsType<PresignedUploadDto>(okResult.Value);
        Assert.Equal("file.png", payload.FileName);
        Assert.Equal("https://upload-url", payload.UploadUrl);
    }

    [Fact]
    public async Task CreatePresignedUpload_ShouldReturnBadRequest_WhenServiceThrowsArgumentException()
    {
        // Arrange
        var request = new CreatePresignedUploadRequestDto("application/pdf", 1024);
        _imageServiceMock
            .Setup(s => s.CreatePresignedUploadAsync(request.ContentType, request.SizeBytes))
            .ThrowsAsync(new ArgumentException("Unsupported image content type"));

        // Act
        var result = await _controller.CreatePresignedUpload(request);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Unsupported image content type", badRequest.Value);
    }

    [Fact]
    public async Task Upload_ShouldReturnBadRequest_WhenFileExceedsMaxSize()
    {
        // Arrange
        var file = new FormFile(new MemoryStream(new byte[1]), 0, (5 * 1024 * 1024) + 1, "file", "image.png")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png"
        };

        // Act
        var result = await _controller.Upload(file);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("File size exceeds allowed limit", Assert.IsType<string>(badRequest.Value));
    }

    [Fact]
    public async Task Upload_ShouldReturnOk_WhenFileIsValid()
    {
        // Arrange
        var bytes = new byte[] { 1, 2, 3 };
        var stream = new MemoryStream(bytes);
        var file = new FormFile(stream, 0, stream.Length, "file", "image.png")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png"
        };

        _imageServiceMock
            .Setup(s => s.UploadImageAsync(It.IsAny<Stream>(), "image/png"))
            .ReturnsAsync("stored-image.png");

        // Act
        var result = await _controller.Upload(file);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var fileName = okResult.Value?.GetType().GetProperty("fileName")?.GetValue(okResult.Value)?.ToString();
        Assert.Equal("stored-image.png", fileName);
    }

    [Fact]
    public async Task GetImage_ShouldReturnRedirect_WhenImageExists()
    {
        // Arrange
        _imageServiceMock
            .Setup(s => s.GetImageUrlAsync("cover.jpg"))
            .ReturnsAsync("https://cdn.example.com/cover.jpg");

        // Act
        var result = await _controller.GetImage("cover.jpg");

        // Assert
        var redirect = Assert.IsType<RedirectResult>(result);
        Assert.Equal("https://cdn.example.com/cover.jpg", redirect.Url);
    }
}