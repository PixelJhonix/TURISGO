namespace TuristGo.Domain.Entities;

public class TourSchedule : AuditBase
{
    public int TourId { get; set; }
    public Tour? Tour { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int MaxCapacity { get; set; }
    public int AvailableSpots { get; set; }
}
