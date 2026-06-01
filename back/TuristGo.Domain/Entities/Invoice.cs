using TuristGo.Domain.Enums;

namespace TuristGo.Domain.Entities;

public class Invoice : AuditBase
{
    public int ReservationId { get; set; }
    public Reservation? Reservation { get; set; }
    public decimal Amount { get; set; }
    public InvoiceStatus Status { get; set; }
}
