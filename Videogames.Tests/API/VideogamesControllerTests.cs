using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Videogames.API.Controllers;
using Videogames.Application.DTOs;
using Videogames.Application.Services;
using Videogames.Domain.Enums;
using Videogames.Domain.ValueObjects;

namespace Videogames.Tests.API;

public class VideogamesControllerTests
{
    private readonly Mock<IVideogameService> _serviceMock;
    private readonly VideogamesController _controller;

    public VideogamesControllerTests()
    {
        _serviceMock = new Mock<IVideogameService>();
        var loggerMock = new Mock<ILogger<VideogamesController>>();
        _controller = new VideogamesController(_serviceMock.Object, loggerMock.Object);
    }

    [Fact]
    public async Task GetMyItems_ShouldReturnUnauthorized_WhenUserClaimIsMissing()
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity())
            }
        };

        var result = await _controller.GetMyItems();

        Assert.IsType<UnauthorizedResult>(result);
        _serviceMock.Verify(
            s => s.GetBySellerIdAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Fact]
    public async Task GetMyItems_ShouldReturnPagedItems_WhenUserIsAuthenticated()
    {
        var sellerId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        SetAuthenticatedUser(sellerId);

        var dto = new VideogameDto(
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            "Test Game",
            new List<LocalizedName>(),
            string.Empty,
            string.Empty,
            "Switch",
            new List<string>(),
            new List<string>(),
            GameState.Released,
            DateTime.UtcNow,
            "1.0",
            "desc",
            string.Empty,
            8.5m,
            50m,
            45m,
            40m,
            9m,
            1,
            new List<GameContent>());

        var paged = new PagedResultDto<VideogameDto>(new[] { dto }, 1, 1, 20, false);

        _serviceMock
            .Setup(s => s.GetBySellerIdAsync(sellerId, 1, 20))
            .ReturnsAsync(paged);

        var result = await _controller.GetMyItems(page: 1, pageSize: 20);

        var ok = Assert.IsType<OkObjectResult>(result);
        var payload = Assert.IsType<PagedResultDto<VideogameDto>>(ok.Value);
        Assert.Single(payload.Items);
        Assert.Equal(1, payload.TotalCount);

        _serviceMock.Verify(s => s.GetBySellerIdAsync(sellerId, 1, 20), Times.Once);
    }

    private void SetAuthenticatedUser(Guid userId)
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) },
                    authenticationType: "TestAuth"))
            }
        };
    }
}
