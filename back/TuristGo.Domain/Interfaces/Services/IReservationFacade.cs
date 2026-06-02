using TuristGo.Domain.Entities;

namespace TuristGo.Domain.Interfaces.Services;

public interface IReservationFacade
{
    Task<Reservation> ConfirmBookingAsync(ConfirmReservationModel request, int touristId);
    Task<Reservation> CancelBookingAsync(int reservationId, int touristId);
    Task<Reservation> CompleteBookingAsync(int reservationId, int agencyId);
    Task<IEnumerable<Reservation>> GetByTouristAsync(int touristId);
    Task<IEnumerable<Reservation>> GetByAgencyAsync(int agencyId);
    Task<Reservation> RescheduleBookingAsync(int reservationId, int touristId, DateOnly newDate);
}
