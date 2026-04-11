using Videogames.Application.DTOs;

namespace Videogames.Application.Services;

public interface IChatService
{
    Task<ConversationDto> StartConversationAsync(Guid videogameId, Guid buyerId);
    Task<MessageDto> SendMessageAsync(Guid conversationId, Guid senderId, string text);
    Task<IEnumerable<ConversationDto>> GetMyConversationsAsync(Guid userId);
    Task<IEnumerable<MessageDto>> GetConversationMessagesAsync(Guid conversationId, Guid userId);
    Task MarkAsReadAsync(Guid conversationId, Guid userId);
}
