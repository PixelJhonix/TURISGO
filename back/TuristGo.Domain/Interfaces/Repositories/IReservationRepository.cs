using TuristGo.Domain.Entities;

namespace TuristGo.Domain.Interfaces.Repositories;

public interface IReservationRepository : IGenericRepository<Reservation>
{
    Task<IEnumerable<Reservation>> GetByTouristAsync(int touristId);
    Task<IEnumerable<Reservation>> GetByAgencyAsync(int agencyId);
    Task<IEnumerable<Reservation>> GetByTourAsync(int tourId);
    Task<Invoice?> GetInvoiceByReservationAsync(int reservationId);
}
