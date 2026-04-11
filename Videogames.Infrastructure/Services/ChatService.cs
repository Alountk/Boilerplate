using Microsoft.EntityFrameworkCore;
using Videogames.Application.DTOs;
using Videogames.Application.Services;
using Videogames.Domain.Entities;
using Videogames.Infrastructure.Persistence;

namespace Videogames.Infrastructure.Services;

public class ChatService : IChatService
{
    private readonly VideogamesDbContext _context;

    public ChatService(VideogamesDbContext context)
    {
        _context = context;
    }

    public async Task<ConversationDto> StartConversationAsync(Guid videogameId, Guid buyerId)
    {
        var game = await _context.Videogames
            .Include(v => v.Seller)
            .FirstOrDefaultAsync(v => v.Id == videogameId);

        if (game == null) throw new Exception("Game not found");

        // Check if conversation already exists
        var existing = await _context.Conversations
            .Include(c => c.Buyer)
            .Include(c => c.Seller)
            .Include(c => c.Videogame)
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.VideogameId == videogameId && c.BuyerId == buyerId);

        if (existing != null) return MapToDto(existing);

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            BuyerId = buyerId,
            SellerId = game.SellerId,
            VideogameId = videogameId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync();

        // Reload to get navigation properties
        var created = await _context.Conversations
            .Include(c => c.Buyer)
            .Include(c => c.Seller)
            .Include(c => c.Videogame)
            .FirstAsync(c => c.Id == conversation.Id);

        return MapToDto(created);
    }

    public async Task<MessageDto> SendMessageAsync(Guid conversationId, Guid senderId, string text)
    {
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            SenderId = senderId,
            Text = text,
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        return new MessageDto(
            message.Id,
            message.ConversationId,
            message.SenderId,
            message.Text,
            message.CreatedAt,
            message.IsRead
        );
    }

    public async Task<IEnumerable<ConversationDto>> GetMyConversationsAsync(Guid userId)
    {
        var conversations = await _context.Conversations
            .Include(c => c.Buyer)
            .Include(c => c.Seller)
            .Include(c => c.Videogame)
            .Include(c => c.Messages)
            .Where(c => c.BuyerId == userId || c.SellerId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return conversations.Select(MapToDto);
    }

    public async Task<IEnumerable<MessageDto>> GetConversationMessagesAsync(Guid conversationId, Guid userId)
    {
        // Security check: ensure user is part of conversation
        var isParticipant = await _context.Conversations
            .AnyAsync(c => c.Id == conversationId && (c.BuyerId == userId || c.SellerId == userId));

        if (!isParticipant) throw new UnauthorizedAccessException();

        var messages = await _context.Messages
            .Where(m => m.ConversationId == conversationId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        return messages.Select(m => new MessageDto(
            m.Id,
            m.ConversationId,
            m.SenderId,
            m.Text,
            m.CreatedAt,
            m.IsRead
        ));
    }

    public async Task MarkAsReadAsync(Guid conversationId, Guid userId)
    {
        var unread = await _context.Messages
            .Where(m => m.ConversationId == conversationId && m.SenderId != userId && !m.IsRead)
            .ToListAsync();

        foreach (var msg in unread)
        {
            msg.IsRead = true;
        }

        await _context.SaveChangesAsync();
    }

    private static ConversationDto MapToDto(Conversation c)
    {
        var lastMsg = c.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault();
        return new ConversationDto(
            c.Id,
            c.BuyerId,
            $"{c.Buyer?.FirstName} {c.Buyer?.LastName}".Trim(),
            c.SellerId,
            $"{c.Seller?.FirstName} {c.Seller?.LastName}".Trim(),
            c.VideogameId,
            c.Videogame?.EnglishName ?? "Unknown Game",
            c.Videogame?.UrlImg,
            c.CreatedAt,
            lastMsg == null ? null : new MessageDto(
                lastMsg.Id,
                lastMsg.ConversationId,
                lastMsg.SenderId,
                lastMsg.Text,
                lastMsg.CreatedAt,
                lastMsg.IsRead
            )
        );
    }
}
