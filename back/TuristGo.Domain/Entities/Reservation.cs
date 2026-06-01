using TuristGo.Domain.Enums;

namespace TuristGo.Domain.Entities;

public class Reservation : AuditBase
{
    public int TouristId { get; set; }
    public Tourist? Tourist { get; set; }
    public int TourId { get; set; }
    public Tour? Tour { get; set; }
    public DateOnly TourDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public int? TourScheduleId { get; set; }
    public TourSchedule? TourSchedule { get; set; }
    public ReservationStatus Status { get; set; }
}
