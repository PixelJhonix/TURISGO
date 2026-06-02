namespace TuristGo.API.DTOs;

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
    string? ImagePlaceholder,
    int AgencyId,
    string AgencyName
);
