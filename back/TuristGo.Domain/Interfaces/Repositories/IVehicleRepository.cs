using TuristGo.Domain.Entities;

namespace TuristGo.Domain.Interfaces.Repositories;

public interface IVehicleRepository : IGenericRepository<Vehicle>
{
    Task<IEnumerable<Vehicle>> GetByAgencyAsync(int agencyId);
    Task<bool> HasFutureToursAsync(int vehicleId);
}
