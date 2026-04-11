namespace Videogames.Domain.Entities;

public class Conversation
{
    public Guid Id { get; set; }
    public Guid BuyerId { get; set; }
    public User Buyer { get; set; } = null!;
    
    public Guid SellerId { get; set; }
    public User Seller { get; set; } = null!;
    
    public Guid VideogameId { get; set; }
    public Videogame Videogame { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; }
    
    public List<Message> Messages { get; set; } = new();
}
