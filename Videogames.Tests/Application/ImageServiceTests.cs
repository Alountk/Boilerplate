using Moq;
using Videogames.Application.DTOs;
using Videogames.Application.Services;
using Videogames.Domain.Ports;
using Xunit;

namespace Videogames.Tests.Application;

public class ImageServiceTests
{
    private readonly Mock<IStoragePort> _storagePortMock;
    private readonly ImageService _service;

    public ImageServiceTests()
    {
        _storagePortMock = new Mock<IStoragePort>();
        _service = new ImageService(_storagePortMock.Object);
    }

    [Theory]
    [InlineData("image/jpeg", ".jpg")]
    [InlineData("image/png", ".png")]
    [InlineData("image/webp", ".webp")]
    public async Task UploadImageAsync_ShouldGenerateGuidAndCorrectExtension(string contentType, string expectedExtension)
    {
        // Arrange
        var stream = new MemoryStream();
        _storagePortMock.Setup(s => s.UploadFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), contentType))
            .ReturnsAsync((Stream s, string name, string type) => name);

        // Act
        var result = await _service.UploadImageAsync(stream, contentType);

        // Assert
        Assert.EndsWith(expectedExtension, result);
        var guidPart = result.Replace(expectedExtension, "");
        Assert.True(Guid.TryParse(guidPart, out _));
        
        _storagePortMock.Verify(s => s.UploadFileAsync(stream, It.IsAny<string>(), contentType), Times.Once);
    }

    [Fact]
    public async Task GetImageUrlAsync_ShouldCallStoragePort()
    {
        // Arrange
        var fileName = "test-image.jpg";
        var expectedUrl = "https://s3.example.com/videogames/test-image.jpg?token=123";
        
        _storagePortMock.Setup(s => s.GetFileUrlAsync(fileName))
            .ReturnsAsync(expectedUrl);

        // Act
        var result = await _service.GetImageUrlAsync(fileName);

        // Assert
        Assert.Equal(expectedUrl, result);
        _storagePortMock.Verify(s => s.GetFileUrlAsync(fileName), Times.Once);
    }

    [Fact]
    public async Task UploadImageAsync_ShouldThrow_WhenContentTypeIsUnsupported()
    {
        // Arrange
        var stream = new MemoryStream();

        // Act + Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.UploadImageAsync(stream, "application/pdf"));

        Assert.Contains("Unsupported image content type", ex.Message);
    }

    [Fact]
    public async Task CreatePresignedUploadAsync_ShouldReturnUploadData_WhenInputIsValid()
    {
        // Arrange
        const string contentType = "image/png";
        const long sizeBytes = 1024;
        const string expectedUploadUrl = "https://minio.local/upload";

        _storagePortMock
            .Setup(s => s.GetUploadFileUrlAsync(
                It.IsAny<string>(),
                contentType,
                It.IsAny<DateTime>()))
            .ReturnsAsync(expectedUploadUrl);

        // Act
        PresignedUploadDto result = await _service.CreatePresignedUploadAsync(contentType, sizeBytes);

        // Assert
        Assert.EndsWith(".png", result.FileName);
        Assert.Equal(expectedUploadUrl, result.UploadUrl);
        Assert.True(result.ExpiresAtUtc > DateTime.UtcNow.AddMinutes(14));

        _storagePortMock.Verify(s => s.GetUploadFileUrlAsync(
            It.IsAny<string>(),
            contentType,
            It.IsAny<DateTime>()), Times.Once);
    }

    [Fact]
    public async Task CreatePresignedUploadAsync_ShouldThrow_WhenFileSizeExceedsLimit()
    {
        // Act + Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.CreatePresignedUploadAsync("image/jpeg", 6 * 1024 * 1024));

        Assert.Contains("exceeds allowed limit", ex.Message);
    }
}
