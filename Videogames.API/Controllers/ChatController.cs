using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Videogames.Application.Services;
using Videogames.Application.DTOs;
using System.Security.Claims;

namespace Videogames.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpPost("conversations/{videogameId}")]
    public async Task<ActionResult<ConversationDto>> StartConversation(Guid videogameId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var conversation = await _chatService.StartConversationAsync(videogameId, userId);
        return Ok(conversation);
    }

    [HttpGet("conversations")]
    public async Task<ActionResult<IEnumerable<ConversationDto>>> GetMyConversations()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var conversations = await _chatService.GetMyConversationsAsync(userId);
        return Ok(conversations);
    }

    [HttpGet("conversations/{conversationId}/messages")]
    public async Task<ActionResult<IEnumerable<MessageDto>>> GetMessages(Guid conversationId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        try
        {
            var messages = await _chatService.GetConversationMessagesAsync(conversationId, userId);
            return Ok(messages);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("conversations/{conversationId}/read")]
    public async Task<IActionResult> MarkAsRead(Guid conversationId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await _chatService.MarkAsReadAsync(conversationId, userId);
        return NoContent();
    }
}
