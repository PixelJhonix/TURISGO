using Microsoft.EntityFrameworkCore;
using TuristGo.DataAccess.Context;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Interfaces.Repositories;

namespace TuristGo.DataAccess.Repositories;

public class GuideRepository(TuristGoDbContext context) : GenericRepository<Guide>(context), IGuideRepository
{
    public async Task<IEnumerable<Guide>> GetByAgencyAsync(int agencyId)
        => await context.Guides
            .Where(g => g.AgencyId == agencyId)
            .ToListAsync();

    public async Task<Guide?> GetByIdWithUnavailabilityAsync(int id)
        => await context.Guides
            .Include(g => g.Agency)
            .FirstOrDefaultAsync(g => g.Id == id);
}
