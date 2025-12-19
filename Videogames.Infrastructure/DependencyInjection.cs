using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Videogames.Application.Services;
using Videogames.Application.Settings;
using Videogames.Domain.Ports;
using Videogames.Infrastructure.Persistence;
using Videogames.Infrastructure.Repositories;


namespace Videogames.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (!string.IsNullOrEmpty(connectionString))
        {
            services.AddDbContext<VideogamesDbContext>(options =>
                options.UseNpgsql(connectionString));

            services.AddScoped<IVideogameRepository, PostgresVideogameRepository>();
            services.AddScoped<IUserRepository, PostgresUserRepository>();
        }
        else
        {
            services.AddSingleton<IVideogameRepository, InMemoryVideogameRepository>();
            services.AddSingleton<IUserRepository, InMemoryUserRepository>();
        }

        // Configuration
        // Configuration
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        // Application Services
        services.AddScoped<IVideogameService, VideogameService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ITokenService, TokenService>();
        
        return services;
    }
}
