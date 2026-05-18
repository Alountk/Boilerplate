using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Videogames.API.Controllers;
using Videogames.Application.DTOs;
using Videogames.Application.Services;

namespace Videogames.Tests.API;

public class ChatControllerTests
{
    private readonly Mock<IChatService> _chatServiceMock;
    private readonly ChatController _controller;
    private readonly Guid _userId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    public ChatControllerTests()
    {
        _chatServiceMock = new Mock<IChatService>();
        _controller = new ChatController(_chatServiceMock.Object);
        SetAuthenticatedUser(_userId);
    }

    [Fact]
    public async Task StartConversation_ShouldReturnOk_WhenServiceSucceeds()
    {
        var videogameId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var expected = new ConversationDto(
            Guid.Parse("33333333-3333-3333-3333-333333333333"),
            _userId,
            "Buyer One",
            Guid.Parse("44444444-4444-4444-4444-444444444444"),
            "Seller One",
            videogameId,
            "Game One",
            null,
            DateTime.UtcNow,
            null);

        _chatServiceMock
            .Setup(s => s.StartConversationAsync(videogameId, _userId))
            .ReturnsAsync(expected);

        var result = await _controller.StartConversation(videogameId);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<ConversationDto>(okResult.Value);
        Assert.Equal(expected.Id, payload.Id);
        Assert.Equal(expected.BuyerId, payload.BuyerId);
        _chatServiceMock.Verify(s => s.StartConversationAsync(videogameId, _userId), Times.Once);
    }

    [Fact]
    public async Task GetMyConversations_ShouldReturnOk_WithConversations()
    {
        var conversations = new[]
        {
            new ConversationDto(
                Guid.Parse("33333333-3333-3333-3333-333333333333"),
                _userId,
                "Buyer One",
                Guid.Parse("44444444-4444-4444-4444-444444444444"),
                "Seller One",
                Guid.Parse("55555555-5555-5555-5555-555555555555"),
                "Game One",
                null,
                DateTime.UtcNow,
                null)
        };

        _chatServiceMock
            .Setup(s => s.GetMyConversationsAsync(_userId))
            .ReturnsAsync(conversations);

        var result = await _controller.GetMyConversations();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsAssignableFrom<IEnumerable<ConversationDto>>(okResult.Value);
        Assert.Single(payload);
        _chatServiceMock.Verify(s => s.GetMyConversationsAsync(_userId), Times.Once);
    }

    [Fact]
    public async Task GetMessages_ShouldReturnOk_WhenUserHasAccess()
    {
        var conversationId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        var messages = new[]
        {
            new MessageDto(
                Guid.Parse("77777777-7777-7777-7777-777777777777"),
                conversationId,
                _userId,
                "Hello",
                DateTime.UtcNow,
                false)
        };

        _chatServiceMock
            .Setup(s => s.GetConversationMessagesAsync(conversationId, _userId))
            .ReturnsAsync(messages);

        var result = await _controller.GetMessages(conversationId);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsAssignableFrom<IEnumerable<MessageDto>>(okResult.Value);
        Assert.Single(payload);
        _chatServiceMock.Verify(s => s.GetConversationMessagesAsync(conversationId, _userId), Times.Once);
    }

    [Fact]
    public async Task GetMessages_ShouldReturnForbid_WhenServiceRejectsAccess()
    {
        var conversationId = Guid.Parse("66666666-6666-6666-6666-666666666666");

        _chatServiceMock
            .Setup(s => s.GetConversationMessagesAsync(conversationId, _userId))
            .ThrowsAsync(new UnauthorizedAccessException());

        var result = await _controller.GetMessages(conversationId);

        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task MarkAsRead_ShouldReturnNoContent_WhenServiceCompletes()
    {
        var conversationId = Guid.Parse("66666666-6666-6666-6666-666666666666");

        _chatServiceMock
            .Setup(s => s.MarkAsReadAsync(conversationId, _userId))
            .Returns(Task.CompletedTask);

        var result = await _controller.MarkAsRead(conversationId);

        Assert.IsType<NoContentResult>(result);
        _chatServiceMock.Verify(s => s.MarkAsReadAsync(conversationId, _userId), Times.Once);
    }

    private void SetAuthenticatedUser(Guid userId)
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, userId.ToString())
                    },
                    authenticationType: "TestAuth"))
            }
        };
    }
}