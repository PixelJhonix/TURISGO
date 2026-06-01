namespace TuristGo.Domain.Entities;

public class Review : AuditBase
{
    public int ReservationId { get; set; }
    public Reservation? Reservation { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
}
