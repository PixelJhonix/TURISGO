using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Observers;

public class CapacityObserver(ITourRepository tourRepository) : IReservationObserver
{
    public async Task OnReservationUpdatedAsync(ReservationEventDTO evento)
    {
        var tour = await tourRepository.GetByIdAsync(evento.TourId);
        if (tour is null) return;
        if (evento.NewStatus == ReservationStatus.Confirmed) tour.AvailableCapacity = Math.Max(0, tour.AvailableCapacity - 1);
        if (evento.NewStatus == ReservationStatus.Cancelled) tour.AvailableCapacity += 1;
        await tourRepository.UpdateAsync(tour);
    }
}
