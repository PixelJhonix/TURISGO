using Microsoft.EntityFrameworkCore;
using TuristGo.DataAccess.Context;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Interfaces.Repositories;

namespace TuristGo.DataAccess.Repositories;

public class ReviewRepository(TuristGoDbContext context) : GenericRepository<Review>(context), IReviewRepository
{
    // HU-55 CA-02: índice único en BD garantiza 1 reseña por reserva, pero validamos antes
    public async Task<bool> ExistsByReservationAsync(int reservationId)
        => await context.Reviews.AnyAsync(r => r.ReservationId == reservationId);
}
