using Moq;
using Videogames.Application.DTOs;
using Videogames.Application.Security;
using Videogames.Application.Services;
using Videogames.Domain.Entities;
using Videogames.Domain.Ports;
using Videogames.Domain.ValueObjects;
using Xunit;

namespace Videogames.Tests.Application;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _mockRepository;
    private readonly Mock<ITokenService> _mockTokenService;
    private readonly UserService _service;

    public UserServiceTests()
    {
        _mockRepository = new Mock<IUserRepository>();
        _mockTokenService = new Mock<ITokenService>();
        _service = new UserService(_mockRepository.Object, _mockTokenService.Object);
    }

    [Fact]
    public async Task CreateAsync_ValidUser_ReturnsUserDto()
    {
        // Arrange
        var createDto = new CreateUserDto(
            "John",
            "Doe",
            "john.doe@example.com",
            "SecurePassword123",
            "123 Main St",
            "New York",
            "USA",
            "+1234567890"
        );

        _mockRepository.Setup(r => r.EmailExistsAsync(It.IsAny<string>()))
            .ReturnsAsync(false);

        _mockRepository.Setup(r => r.CreateAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => u);

        // Act
        var result = await _service.CreateAsync(createDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("John", result.FirstName);
        Assert.Equal("Doe", result.LastName);
        Assert.Equal("john.doe@example.com", result.Email);
        Assert.Equal("123 Main St", result.Address);
        Assert.Equal("New York", result.City);
        Assert.Equal("USA", result.Country);
        Assert.Equal("+1234567890", result.Phone);

        _mockRepository.Verify(r => r.CreateAsync(It.Is<User>(u =>
            u.FirstName == "John" &&
            u.LastName == "Doe" &&
            u.Email.Value == "john.doe@example.com" &&
            !string.IsNullOrEmpty(u.PasswordHash)
        )), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DuplicateEmail_ThrowsException()
    {
        // Arrange
        var createDto = new CreateUserDto(
            "John",
            "Doe",
            "john.doe@example.com",
            "SecurePassword123",
            "123 Main St",
            "New York",
            "USA",
            "+1234567890"
        );

        _mockRepository.Setup(r => r.EmailExistsAsync("john.doe@example.com"))
            .ReturnsAsync(true);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CreateAsync(createDto));

        Assert.Contains("already exists", exception.Message);
        _mockRepository.Verify(r => r.CreateAsync(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_PasswordIsHashed()
    {
        // Arrange
        var createDto = new CreateUserDto(
            "John",
            "Doe",
            "john.doe@example.com",
            "PlainTextPassword",
            "123 Main St",
            "New York",
            "USA",
            "+1234567890"
        );

        User? capturedUser = null;

        _mockRepository.Setup(r => r.EmailExistsAsync(It.IsAny<string>()))
            .ReturnsAsync(false);

        _mockRepository.Setup(r => r.CreateAsync(It.IsAny<User>()))
            .Callback<User>(u => capturedUser = u)
            .ReturnsAsync((User u) => u);

        // Act
        await _service.CreateAsync(createDto);

        // Assert
        Assert.NotNull(capturedUser);
        Assert.NotEqual("PlainTextPassword", capturedUser.PasswordHash);
        Assert.True(PasswordHasher.VerifyPassword("PlainTextPassword", capturedUser.PasswordHash));
    }

    [Fact]
    public async Task GetByIdAsync_ExistingUser_ReturnsUserDto()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            FirstName = "Jane",
            LastName = "Smith",
            Email = Email.Create("jane.smith@example.com"),
            PasswordHash = "hashedpassword",
            Address = "456 Oak Ave",
            City = "Los Angeles",
            Country = "USA",
            Phone = "+0987654321",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockRepository.Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync(user);

        // Act
        var result = await _service.GetByIdAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.Id);
        Assert.Equal("Jane", result.FirstName);
        Assert.Equal("jane.smith@example.com", result.Email);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingUser_ReturnsNull()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _mockRepository.Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _service.GetByIdAsync(userId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_ValidUpdate_UpdatesUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var existingUser = new User
        {
            Id = userId,
            FirstName = "John",
            LastName = "Doe",
            Email = Email.Create("john.doe@example.com"),
            PasswordHash = PasswordHasher.HashPassword("OldPassword"),
            Address = "Old Address",
            City = "Old City",
            Country = "Old Country",
            Phone = "Old Phone",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };

        var updateDto = new UpdateUserDto(
            "UpdatedJohn",
            "UpdatedDoe",
            null,
            "NewPassword123",
            "New Address",
            "New City",
            "New Country",
            "New Phone"
        );

        _mockRepository.Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync(existingUser);

        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<User>()))
            .Returns(Task.CompletedTask);

        // Act
        await _service.UpdateAsync(userId, updateDto);

        // Assert
        _mockRepository.Verify(r => r.UpdateAsync(It.Is<User>(u =>
            u.FirstName == "UpdatedJohn" &&
            u.LastName == "UpdatedDoe" &&
            u.Address == "New Address" &&
            u.City == "New City" &&
            u.Country == "New Country" &&
            u.Phone == "New Phone" &&
            PasswordHasher.VerifyPassword("NewPassword123", u.PasswordHash)
        )), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingUser_ThrowsException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var updateDto = new UpdateUserDto("John", "Doe", null, null, null, null, null, null);

        _mockRepository.Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync((User?)null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.UpdateAsync(userId, updateDto));
    }

    [Fact]
    public async Task DeleteAsync_CallsRepository()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _mockRepository.Setup(r => r.DeleteAsync(userId))
            .Returns(Task.CompletedTask);

        // Act
        await _service.DeleteAsync(userId);

        // Assert
        _mockRepository.Verify(r => r.DeleteAsync(userId), Times.Once);
    }
}
