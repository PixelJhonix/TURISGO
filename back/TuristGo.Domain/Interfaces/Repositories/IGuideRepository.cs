using TuristGo.Domain.Entities;

namespace TuristGo.Domain.Interfaces.Repositories;

public interface IGuideRepository : IGenericRepository<Guide>
{
    Task<IEnumerable<Guide>> GetByAgencyAsync(int agencyId);
    Task<Guide?> GetByIdWithUnavailabilityAsync(int id);
}
