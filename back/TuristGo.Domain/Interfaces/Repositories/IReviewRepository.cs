using TuristGo.Domain.Entities;

namespace TuristGo.Domain.Interfaces.Repositories;

public interface IReviewRepository : IGenericRepository<Review>
{
    Task<bool> ExistsByReservationAsync(int reservationId);
}
