namespace TuristGo.Domain.Entities;

public class GuideUnavailability : AuditBase
{
    public int GuideId { get; set; }
    public Guide? Guide { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
}
