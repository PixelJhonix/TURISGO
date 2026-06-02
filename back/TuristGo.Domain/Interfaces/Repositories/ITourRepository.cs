using TuristGo.Domain.Entities;

namespace TuristGo.Domain.Interfaces.Repositories;

public interface ITourRepository : IGenericRepository<Tour>
{
    Task<IEnumerable<Tour>> GetByAgencyAsync(int agencyId);
    Task<IEnumerable<Tour>> GetByGuideAsync(int guideId);
    Task<bool> HasFutureConfirmedReservationsAsync(int tourId);
    Task<Guide?> GetGuideForAssignmentAsync(int guideId, DateTime tourStart, int durationMinutes);
    Task<bool> GuideHasScheduleConflictAsync(int guideId, int excludeTourId, DateTime tourStart, int durationMinutes);
    Task<Vehicle?> GetVehicleForAssignmentAsync(int vehicleId);
    Task UpdateVehicleAsync(Vehicle vehicle);
}
