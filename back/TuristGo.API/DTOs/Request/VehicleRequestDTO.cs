namespace TuristGo.API.DTOs;

public record VehicleRequestDTO(
    string LicensePlate,
    string Brand,
    string Model,
    int Year,
    int PassengerCapacity
);
