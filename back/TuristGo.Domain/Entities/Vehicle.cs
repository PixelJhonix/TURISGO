using TuristGo.Domain.Enums;

namespace TuristGo.Domain.Entities;

public class Vehicle : AuditBase
{
    public string LicensePlate { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public int PassengerCapacity { get; set; }
    public VehicleStatus Status { get; set; }
    public int AgencyId { get; set; }
    public Agency? Agency { get; set; }
}
