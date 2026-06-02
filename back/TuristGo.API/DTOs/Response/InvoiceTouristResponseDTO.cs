namespace TuristGo.API.DTOs;

public record InvoiceTouristResponseDTO(
    int Id,
    string InvoiceNumber,
    string TourName,
    DateTime IssuedAt,
    decimal Amount,
    string Status
);
