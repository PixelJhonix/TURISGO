namespace TuristGo.API.DTOs;

public record ReservationResponseDTO(
    int Id,
    string ReservationNumber,
    int TourId,
    string TourName,
    string TourDate,
    string Status,
    decimal Amount
);
