using TuristGo.Domain.Entities;

namespace TuristGo.Domain.Interfaces.Repositories;

public interface ITourRepository : IGenericRepository<Tour>
{
    Task<IEnumerable<Tour>> GetByAgencyAsync(int agencyId);
    Task<bool> HasFutureConfirmedReservationsAsync(int tourId);
}
