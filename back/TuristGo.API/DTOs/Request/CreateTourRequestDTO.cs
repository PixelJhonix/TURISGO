namespace TuristGo.API.DTOs;

public record CreateTourRequestDTO(
    string Name,
    string Description,
    string Category,
    string City,
    decimal Price,
    int TotalCapacity,
    DateTime StartTime,
    int DurationMinutes,
    string MeetingPoint,
    string? ImageUrl = null
);
