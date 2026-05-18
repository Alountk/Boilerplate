using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Videogames.Application.Services;
using Videogames.Domain.Entities;
using Videogames.Domain.Enums;
using Videogames.Domain.ValueObjects;
using Videogames.Infrastructure.Persistence;
using Videogames.Infrastructure.Services;

namespace Videogames.Tests.Application;

public class ChatServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly VideogamesDbContext _context;
    private readonly ChatService _service;

    public ChatServiceTests()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<VideogamesDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new VideogamesDbContext(options);
        _context.Database.EnsureCreated();
        _service = new ChatService(_context);
    }

    [Fact]
    public async Task StartConversationAsync_CreatesConversation_WhenNoneExists()
    {
        var buyer = CreateUser("buyer@example.com", "Buyer", "One");
        var seller = CreateUser("seller@example.com", "Seller", "One");
        var videogame = CreateVideogame(seller.Id, "Halo Example");

        _context.Users.AddRange(buyer, seller);
        _context.Videogames.Add(videogame);
        await _context.SaveChangesAsync();

        var dto = await _service.StartConversationAsync(videogame.Id, buyer.Id);

        Assert.Equal(buyer.Id, dto.BuyerId);
        Assert.Equal(seller.Id, dto.SellerId);
        Assert.Equal(videogame.Id, dto.VideogameId);
        Assert.Equal("Buyer One", dto.BuyerName);
        Assert.Equal("Seller One", dto.SellerName);

        var conversationCount = await _context.Conversations.CountAsync();
        Assert.Equal(1, conversationCount);
    }

    [Fact]
    public async Task StartConversationAsync_ReturnsExistingConversation_WhenAlreadyCreated()
    {
        var buyer = CreateUser("buyer@example.com", "Buyer", "One");
        var seller = CreateUser("seller@example.com", "Seller", "One");
        var videogame = CreateVideogame(seller.Id, "Halo Example");

        _context.Users.AddRange(buyer, seller);
        _context.Videogames.Add(videogame);
        await _context.SaveChangesAsync();

        var first = await _service.StartConversationAsync(videogame.Id, buyer.Id);
        var second = await _service.StartConversationAsync(videogame.Id, buyer.Id);

        Assert.Equal(first.Id, second.Id);
        Assert.Equal(1, await _context.Conversations.CountAsync());
    }

    [Fact]
    public async Task GetConversationMessagesAsync_Throws_WhenUserIsNotParticipant()
    {
        var buyer = CreateUser("buyer@example.com", "Buyer", "One");
        var seller = CreateUser("seller@example.com", "Seller", "One");
        var stranger = CreateUser("stranger@example.com", "Stranger", "Three");
        var videogame = CreateVideogame(seller.Id, "Halo Example");

        _context.Users.AddRange(buyer, seller, stranger);
        _context.Videogames.Add(videogame);
        await _context.SaveChangesAsync();

        var conversation = await _service.StartConversationAsync(videogame.Id, buyer.Id);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _service.GetConversationMessagesAsync(conversation.Id, stranger.Id));
    }

    [Fact]
    public async Task SendMessageAsync_PersistsMessage_WithUnreadFlag()
    {
        var buyer = CreateUser("buyer@example.com", "Buyer", "One");
        var seller = CreateUser("seller@example.com", "Seller", "One");
        var videogame = CreateVideogame(seller.Id, "Halo Example");

        _context.Users.AddRange(buyer, seller);
        _context.Videogames.Add(videogame);
        await _context.SaveChangesAsync();

        var conversation = await _service.StartConversationAsync(videogame.Id, buyer.Id);
        var message = await _service.SendMessageAsync(conversation.Id, buyer.Id, "Hello seller");

        Assert.Equal(conversation.Id, message.ConversationId);
        Assert.Equal(buyer.Id, message.SenderId);
        Assert.False(message.IsRead);

        var stored = await _context.Messages.SingleAsync();
        Assert.Equal("Hello seller", stored.Text);
        Assert.False(stored.IsRead);
    }

    [Fact]
    public async Task MarkAsReadAsync_MarksIncomingMessagesAsRead()
    {
        var buyer = CreateUser("buyer@example.com", "Buyer", "One");
        var seller = CreateUser("seller@example.com", "Seller", "One");
        var videogame = CreateVideogame(seller.Id, "Halo Example");

        _context.Users.AddRange(buyer, seller);
        _context.Videogames.Add(videogame);
        await _context.SaveChangesAsync();

        var conversation = await _service.StartConversationAsync(videogame.Id, buyer.Id);
        await _service.SendMessageAsync(conversation.Id, seller.Id, "Incoming message");

        await _service.MarkAsReadAsync(conversation.Id, buyer.Id);

        var stored = await _context.Messages.SingleAsync();
        Assert.True(stored.IsRead);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    private static User CreateUser(string email, string firstName, string lastName)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            FirstName = firstName,
            LastName = lastName,
            Email = Email.Create(email),
            PasswordHash = "hashed-password",
            Address = "Test address",
            City = "Test city",
            Country = "Test country",
            Phone = "+1234567890",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
    }

    private static Videogame CreateVideogame(Guid sellerId, string englishName)
    {
        return new Videogame
        {
            Id = Guid.NewGuid(),
            EnglishName = englishName,
            Qr = string.Empty,
            Codebar = string.Empty,
            Console = "PlayStation 5",
            Assets = new List<string>(),
            Images = new List<string>(),
            State = GameState.Released,
            ReleaseDate = DateTime.UtcNow.Date,
            VersionGame = "1.0",
            Description = "Test videogame",
            UrlImg = string.Empty,
            GeneralState = 8,
            AveragePrice = 50,
            OwnPrice = 45,
            AcceptOffersRange = 0,
            Score = 80,
            Category = 0,
            SellerId = sellerId,
            Contents = new List<GameContent>(),
        };
    }
}