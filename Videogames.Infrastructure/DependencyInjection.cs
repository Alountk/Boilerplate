using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Videogames.Application.Services;
using Videogames.Application.Settings;
using Videogames.Domain.Ports;
using Videogames.Infrastructure.Adapters;
using Videogames.Infrastructure.Configuration;
using Videogames.Infrastructure.Persistence;
using Videogames.Infrastructure.Repositories;
using Videogames.Infrastructure.Services;


namespace Videogames.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (!string.IsNullOrEmpty(connectionString))
        {
            services.AddDbContext<VideogamesDbContext>(options =>
                options.UseNpgsql(connectionString, npgsqlOptions =>
                    npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

            services.AddScoped<IVideogameRepository, PostgresVideogameRepository>();
            services.AddScoped<IUserRepository, PostgresUserRepository>();
            services.AddScoped<IChatService, ChatService>();
        }
        else
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("WARNING: 'DefaultConnection' connection string is missing or empty.");
            Console.WriteLine("Falling back to IN-MEMORY repositories. Data will be lost on restart.");
            Console.ResetColor();

            services.AddSingleton<IVideogameRepository, InMemoryVideogameRepository>();
            services.AddSingleton<IUserRepository, InMemoryUserRepository>();
            // Note: InMemoryChatService would go here if implemented
        }

        // Configuration
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.Configure<MinioSettings>(configuration.GetSection(MinioSettings.SectionName));

        // Application Services
        services.AddScoped<IVideogameService, VideogameService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IRegistrationVerificationService, RegistrationVerificationService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IImageService, ImageService>();
        services.AddScoped<IEmailSender, SmtpEmailSender>();

        // Adapters
        services.AddScoped<IStoragePort, MinioStorageAdapter>();
        
        return services;
    }
}
