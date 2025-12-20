namespace Videogames.Domain.ValueObjects;

public record GameContent(
    string FrontalUrl,
    string BackUrl,
    string RightSideUrl,
    string LeftSideUrl,
    string TopSideUrl,
    string BottomSideUrl
);
