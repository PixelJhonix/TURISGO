namespace TuristGo.Domain.Interfaces.Services;

public interface IReservationObserver
{
    Task OnReservationUpdatedAsync(ReservationEventDTO evento);
}
