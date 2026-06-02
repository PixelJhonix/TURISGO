namespace TuristGo.API.DTOs;

public record InvoiceAgencyResponseDTO(
    int Id,
    string InvoiceNumber,
    string TourName,
    DateTime IssuedAt,
    decimal Amount,
    decimal RetentionAmount,
    decimal NetAmount,
    string Status,
    bool IsManual
);
