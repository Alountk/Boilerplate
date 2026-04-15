namespace Videogames.Application.DTOs;

/// <summary>
/// For Google: pass the access_token from @react-oauth/google.
/// For Apple: pass the id_token from Apple Sign In JS SDK.
/// </summary>
public record OAuthLoginDto(string IdToken);
