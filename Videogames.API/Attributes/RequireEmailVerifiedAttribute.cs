using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace Videogames.API.Attributes;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class RequireEmailVerifiedAttribute : Attribute, IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        if (context == null)
        {
            throw new ArgumentNullException(nameof(context));
        }

        var user = context.HttpContext.User;
        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedObjectResult(new { error = "Authentication required" });
            return;
        }

        var emailVerifiedClaim = user.FindFirst("email_verified");
        if (emailVerifiedClaim == null || !bool.TryParse(emailVerifiedClaim.Value, out var isVerified) || !isVerified)
        {
            context.Result = new ObjectResult(new { error = "Email verification required" })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }

        await Task.CompletedTask;
    }
}
