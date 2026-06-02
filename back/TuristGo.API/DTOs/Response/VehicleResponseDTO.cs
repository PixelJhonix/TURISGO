namespace TuristGo.API.DTOs;

public record VehicleResponseDTO(
    int Id,
    string LicensePlate,
    string Brand,
    string Model,
    int Year,
    int PassengerCapacity,
    string Status
);
