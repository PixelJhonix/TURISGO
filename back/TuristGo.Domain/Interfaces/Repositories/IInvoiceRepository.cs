using TuristGo.Domain.Entities;

namespace TuristGo.Domain.Interfaces.Repositories;

public interface IInvoiceRepository : IGenericRepository<Invoice>
{
    Task<IEnumerable<Invoice>> GetAllWithDetailsAsync();
    Task<IEnumerable<Invoice>> GetByTouristAsync(int touristId);
    Task<IEnumerable<Invoice>> GetByAgencyAsync(int agencyId, DateOnly? start, DateOnly? end);
    Task<int> CountCompletedReservationsByPeriodAsync(DateOnly start, DateOnly end);
    Task<Invoice> CreateManualAsync(int agencyId, int reservationId, decimal amount, string description);
}
