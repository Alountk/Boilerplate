using Microsoft.AspNetCore.SignalR;
using Videogames.Application.Services;
using System.Security.Claims;

namespace Videogames.Infrastructure.RealTime;

public class ChatHub : Hub
{
    private readonly IChatService _chatService;

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    public async Task JoinConversation(string conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, conversationId);
    }

    public async Task LeaveConversation(string conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, conversationId);
    }

    public async Task SendMessage(Guid conversationId, string text)
    {
        var userIdString = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            throw new HubException("User not authenticated");
        }

        var messageDto = await _chatService.SendMessageAsync(conversationId, userId, text);
        
        // Broadcast to the conversation group
        await Clients.Group(conversationId.ToString().ToLower()).SendAsync("ReceiveMessage", messageDto);
        
        // Optionally notify conversation list update for participants
        // This could be achieved by sending to users directly if we tracked connections by userId
    }
}
