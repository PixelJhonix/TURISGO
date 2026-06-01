using Microsoft.EntityFrameworkCore;
using TuristGo.DataAccess.Context;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;

namespace TuristGo.DataAccess.Repositories;

public class TourRepository(TuristGoDbContext context) : GenericRepository<Tour>(context), ITourRepository
{
    public override async Task<Tour?> GetByIdAsync(int id)
        => await context.Tours
            .Include(x => x.Agency)
            .Include(x => x.Guide)
            .Include(x => x.Vehicle)
            .Include(x => x.Schedules)
            .FirstOrDefaultAsync(x => x.Id == id);

    public override async Task<IEnumerable<Tour>> GetAllAsync()
        => await context.Tours
            .Include(x => x.Agency)
            .Include(x => x.Schedules)
            .ToListAsync();

    public async Task<IEnumerable<Tour>> GetByAgencyAsync(int agencyId)
        => await context.Tours.Where(x => x.AgencyId == agencyId).ToListAsync();

    public async Task<bool> HasFutureConfirmedReservationsAsync(int tourId)
        => await context.Reservations.AnyAsync(r =>
            r.TourId == tourId &&
            r.Status == ReservationStatus.Confirmed &&
            r.TourDate >= DateOnly.FromDateTime(DateTime.UtcNow));
}
