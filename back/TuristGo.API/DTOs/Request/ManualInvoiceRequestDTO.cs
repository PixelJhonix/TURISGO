namespace TuristGo.API.DTOs;

public record ManualInvoiceRequestDTO(int ReservationId, decimal Amount, string Description);
