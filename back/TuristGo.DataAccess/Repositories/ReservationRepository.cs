using Microsoft.EntityFrameworkCore;
using TuristGo.DataAccess.Context;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Interfaces.Repositories;

namespace TuristGo.DataAccess.Repositories;

public class ReservationRepository(TuristGoDbContext context) : GenericRepository<Reservation>(context), IReservationRepository
{
    public override async Task<Reservation?> GetByIdAsync(int id)
        => await context.Reservations
            .Include(x => x.Tour)
            .ThenInclude(t => t!.Agency)
            .Include(x => x.Tourist)
            .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<IEnumerable<Reservation>> GetByTouristAsync(int touristId)
        => await context.Reservations
            .Include(x => x.Tour).ThenInclude(t => t!.Agency)
            .Where(x => x.TouristId == touristId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

    // HU-40: reservas filtradas por agencia
    public async Task<IEnumerable<Reservation>> GetByAgencyAsync(int agencyId)
        => await context.Reservations
            .Include(x => x.Tour).ThenInclude(t => t!.Agency)
            .Include(x => x.Tourist)
            .Where(x => x.Tour!.AgencyId == agencyId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

    public async Task<IEnumerable<Reservation>> GetByTourAsync(int tourId)
        => await context.Reservations
            .Include(r => r.Tourist)
            .Where(r => r.TourId == tourId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

    public async Task<Invoice?> GetInvoiceByReservationAsync(int reservationId)
        => await context.Invoices.FirstOrDefaultAsync(i => i.ReservationId == reservationId);
}
