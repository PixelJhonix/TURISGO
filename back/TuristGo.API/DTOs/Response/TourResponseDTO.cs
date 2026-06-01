namespace TuristGo.API.DTOs;

// A.6: campos extendidos — retrocompatibles (nuevos campos opcionales no rompen consumidores anteriores)
public record TourResponseDTO(
    int Id,
    string Name,
    string Description,
    string Category,
    string City,
    decimal Price,
    int TotalCapacity,
    int AvailableCapacity,
    string MeetingPoint,
    DateTime StartTime,
    int DurationMinutes,
    decimal AverageRating,
    string Status,
    int? GuideId,
    int? VehicleId,
    string? ImagePlaceholder
);
