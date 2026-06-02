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

    // HU-22: tours asignados al guía
    public async Task<IEnumerable<Tour>> GetByGuideAsync(int guideId)
        => await context.Tours
            .Include(t => t.Vehicle)
            .Include(t => t.Agency)
            .Where(t => t.GuideId == guideId)
            .OrderBy(t => t.StartTime)
            .ToListAsync();

    public async Task<bool> HasFutureConfirmedReservationsAsync(int tourId)
        => await context.Reservations.AnyAsync(r =>
            r.TourId == tourId &&
            r.Status == ReservationStatus.Confirmed &&
            r.TourDate >= DateOnly.FromDateTime(DateTime.UtcNow));

    public async Task<Guide?> GetGuideForAssignmentAsync(int guideId, DateTime tourStart, int durationMinutes)
        => await context.Guides
            .Include(g => g.Agency)
            .FirstOrDefaultAsync(g => g.Id == guideId);

    // GUIDE-04: detectar cruce horario con otros tours del mismo guía
    public async Task<bool> GuideHasScheduleConflictAsync(int guideId, int excludeTourId, DateTime tourStart, int durationMinutes)
    {
        var tourEnd = tourStart.AddMinutes(durationMinutes);
        return await context.Tours.AnyAsync(t =>
            t.Id != excludeTourId &&
            t.GuideId == guideId &&
            t.Status == TourStatus.Active &&
            t.StartTime < tourEnd &&
            t.StartTime.AddMinutes(t.DurationMinutes) > tourStart);
    }

    public async Task<Vehicle?> GetVehicleForAssignmentAsync(int vehicleId)
        => await context.Vehicles.FindAsync(vehicleId);

    public async Task UpdateVehicleAsync(Vehicle vehicle)
    {
        vehicle.UpdatedAt = DateTime.UtcNow;
        context.Vehicles.Update(vehicle);
        await context.SaveChangesAsync();
    }
}
