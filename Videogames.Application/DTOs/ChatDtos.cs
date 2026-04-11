namespace Videogames.Application.DTOs;

public record ConversationDto(
    Guid Id,
    Guid BuyerId,
    string BuyerName,
    Guid SellerId,
    string SellerName,
    Guid VideogameId,
    string VideogameName,
    string? VideogameUrlImg,
    DateTime CreatedAt,
    MessageDto? LastMessage
);

public record MessageDto(
    Guid Id,
    Guid ConversationId,
    Guid SenderId,
    string Text,
    DateTime CreatedAt,
    bool IsRead
);
