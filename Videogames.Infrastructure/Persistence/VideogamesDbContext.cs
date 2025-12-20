using Microsoft.EntityFrameworkCore;
using Videogames.Domain.Entities;
using Videogames.Domain.ValueObjects;

namespace Videogames.Infrastructure.Persistence;

public class VideogamesDbContext : DbContext
{
    public VideogamesDbContext(DbContextOptions<VideogamesDbContext> options) : base(options)
    {
    }

    public DbSet<Videogame> Videogames { get; set; }
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Videogame>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Configure complex types as JSON or owned types if needed.
            // For simplicity in this boilerplate, we'll let EF Core handle basic types.
            // Lists might need special handling depending on how we want to store them (JSONB vs separate tables).
            // For Postgres, we can often use JSONB for lists of strings/objects if we don't need relational queries on them.
            
            entity.OwnsMany(e => e.Names, a =>
            {
                a.WithOwner().HasForeignKey("VideogameId");
                a.Property(n => n.Name);
                a.Property(n => n.Language);
            });

            entity.OwnsMany(e => e.Contents, a =>
            {
                a.WithOwner().HasForeignKey("VideogameId");
                a.Property(c => c.FrontalUrl);
                a.Property(c => c.BackUrl);
                a.Property(c => c.RightSideUrl);
                a.Property(c => c.LeftSideUrl);
                a.Property(c => c.TopSideUrl);
                a.Property(c => c.BottomSideUrl);
            });

            entity.Property(e => e.Assets).HasColumnType("text[]"); // Postgres array
            entity.Property(e => e.Images).HasColumnType("text[]"); // Postgres array
            entity.Property(e => e.GeneralState).HasPrecision(18, 2);
            entity.Property(e => e.AveragePrice).HasPrecision(18, 2);
            entity.Property(e => e.OwnPrice).HasPrecision(18, 2);
            entity.Property(e => e.AcceptOffersRange).HasPrecision(18, 2);
            entity.Property(e => e.Score).HasPrecision(18, 2);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);

            // Configure Email value object
            entity.Property(e => e.Email)
                .HasConversion(
                    email => email.Value,
                    value => Email.Create(value))
                .HasColumnName("Email")
                .IsRequired();

            // Create unique index on Email
            entity.HasIndex(e => e.Email)
                .IsUnique();

            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Address).HasMaxLength(200);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.Country).HasMaxLength(100);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
        });
    }
}
