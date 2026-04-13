namespace Videogames.Application.DTOs;

public record PagedResultDto<T>(
    IEnumerable<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    bool HasMore
);
