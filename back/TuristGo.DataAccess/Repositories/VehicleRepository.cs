using Microsoft.EntityFrameworkCore;
using TuristGo.DataAccess.Context;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;

namespace TuristGo.DataAccess.Repositories;

public class VehicleRepository(TuristGoDbContext context) : GenericRepository<Vehicle>(context), IVehicleRepository
{
    public async Task<IEnumerable<Vehicle>> GetByAgencyAsync(int agencyId)
        => await context.Vehicles.Where(v => v.AgencyId == agencyId).ToListAsync();

    // HU-34 CA-02: bloquear delete si tiene tours futuros confirmados
    public async Task<bool> HasFutureToursAsync(int vehicleId)
        => await context.Tours.AnyAsync(t =>
            t.VehicleId == vehicleId &&
            t.Status == TourStatus.Active &&
            t.StartTime > DateTime.UtcNow);
}
