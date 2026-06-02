namespace TuristGo.API.DTOs;

public record AssignedTourVehicleDTO(int Id, string LicensePlate, string Brand, string Model, int PassengerCapacity);

public record AssignedTourResponseDTO(
    int Id,
    string Code,
    string Name,
    string Category,
    string City,
    DateTime StartTime,
    int DurationMinutes,
    string MeetingPoint,
    string Status,
    int TotalCapacity,
    int AvailableCapacity,
    AssignedTourVehicleDTO? Vehicle
);
