using TuristGo.Domain.Enums;

namespace TuristGo.Domain.Entities;

public class Tour : AuditBase
{
    public int AgencyId { get; set; }
    public Agency? Agency { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string City { get; set; } = "Medellin";
    public decimal Price { get; set; }
    public int TotalCapacity { get; set; }
    public int AvailableCapacity { get; set; }
    public DateTime StartTime { get; set; }
    public int DurationMinutes { get; set; }
    public string MeetingPoint { get; set; } = string.Empty;
    public TourStatus Status { get; set; }
    public string? DeactivationReason { get; set; }
    public string? ImageUrl { get; set; }
    public decimal AverageRating { get; set; }
    public int? GuideId { get; set; }
    public Guide? Guide { get; set; }
    public int? VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }
    public ICollection<TourSchedule> Schedules { get; set; } = new List<TourSchedule>();
}
