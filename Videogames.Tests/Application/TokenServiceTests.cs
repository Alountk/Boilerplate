using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Moq;
using Videogames.Application.Services;
using Videogames.Application.Settings;
using Videogames.Domain.Entities;
using Videogames.Domain.ValueObjects;
using Xunit;

namespace Videogames.Tests.Application;

public class TokenServiceTests
{
    private readonly Mock<IOptions<JwtSettings>> _mockJwtSettings;
    private readonly TokenService _tokenService;
    private readonly JwtSettings _jwtSettings;

    public TokenServiceTests()
    {
        _jwtSettings = new JwtSettings
        {
            Secret = "ThisIsAStrongSecretKeyForTestingOnly123!",
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            ExpiryMinutes = 60
        };

        _mockJwtSettings = new Mock<IOptions<JwtSettings>>();
        _mockJwtSettings.Setup(s => s.Value).Returns(_jwtSettings);

        _tokenService = new TokenService(_mockJwtSettings.Object);
    }

    [Fact]
    public void GenerateToken_ShouldReturnValidToken()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Test",
            LastName = "User",
            Email = Email.Create("test@example.com")
        };

        // Act
        var token = _tokenService.GenerateToken(user);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);

        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        Assert.Equal(_jwtSettings.Issuer, jwtToken.Issuer);
        Assert.Equal(_jwtSettings.Audience, jwtToken.Audiences.First());
        
        var claims = jwtToken.Claims.ToList();
        Assert.Contains(claims, c => c.Type == "nameid" && c.Value == user.Id.ToString());
        Assert.Contains(claims, c => c.Type == "email" && c.Value == user.Email.Value);
        Assert.Contains(claims, c => c.Type == "given_name" && c.Value == user.FirstName);
        Assert.Contains(claims, c => c.Type == "family_name" && c.Value == user.LastName);
    }
}
