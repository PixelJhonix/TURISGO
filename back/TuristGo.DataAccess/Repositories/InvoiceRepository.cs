using Microsoft.EntityFrameworkCore;
using TuristGo.DataAccess.Context;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;

namespace TuristGo.DataAccess.Repositories;

public class InvoiceRepository(TuristGoDbContext context) : GenericRepository<Invoice>(context), IInvoiceRepository
{
    public async Task<IEnumerable<Invoice>> GetAllWithDetailsAsync()
        => await context.Invoices
            .Include(i => i.Reservation)
            .ThenInclude(r => r!.Tour)
            .ThenInclude(t => t!.Agency)
            .ToListAsync();

    // HU-48: facturas del turista autenticado
    public async Task<IEnumerable<Invoice>> GetByTouristAsync(int touristId)
        => await context.Invoices
            .Include(i => i.Reservation)
            .ThenInclude(r => r!.Tour)
            .Where(i => i.Reservation!.TouristId == touristId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

    // HU-49: facturas de la agencia con filtro por fechas
    public async Task<IEnumerable<Invoice>> GetByAgencyAsync(int agencyId, DateOnly? start, DateOnly? end)
    {
        var query = context.Invoices
            .Include(i => i.Reservation)
            .ThenInclude(r => r!.Tour)
            .ThenInclude(t => t!.Agency)
            .Where(i => i.Reservation!.Tour!.AgencyId == agencyId);

        if (start.HasValue)
            query = query.Where(i => DateOnly.FromDateTime(i.CreatedAt) >= start.Value);
        if (end.HasValue)
            query = query.Where(i => DateOnly.FromDateTime(i.CreatedAt) <= end.Value);

        return await query.OrderByDescending(i => i.CreatedAt).ToListAsync();
    }

    // HU-47: factura manual de agencia
    public async Task<Invoice> CreateManualAsync(int agencyId, int reservationId, decimal amount, string description)
    {
        var reservation = await context.Reservations
            .Include(r => r.Tour)
            .FirstOrDefaultAsync(r => r.Id == reservationId && r.Tour!.AgencyId == agencyId)
            ?? throw new UnauthorizedAccessException("La reserva no pertenece a esta agencia.");
        var invoice = new Invoice
        {
            ReservationId = reservationId,
            Amount = amount,
            Status = InvoiceStatus.Active,
            IsManual = true,
            ManualDescription = description,
        };
        context.Invoices.Add(invoice);
        await context.SaveChangesAsync();
        return invoice;
    }

    // HU-50: reservas completadas en el período
    public async Task<int> CountCompletedReservationsByPeriodAsync(DateOnly start, DateOnly end)
        => await context.Reservations.CountAsync(r =>
            r.Status == ReservationStatus.Completed &&
            r.TourDate >= start &&
            r.TourDate <= end);
}
