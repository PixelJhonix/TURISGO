namespace TuristGo.API.DTOs;

public record AdminInvoiceItemDTO(int Id,
    decimal Amount,
    int Status,
    DateTime CreatedAt,
    int ReservationId,
    int TourId,
    string TourName,
    int AgencyId,
    string AgencyName);
