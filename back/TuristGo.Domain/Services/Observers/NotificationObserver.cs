using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Observers;

public class NotificationObserver : IReservationObserver
{
    public Task OnReservationUpdatedAsync(ReservationEventDTO evento) => Task.CompletedTask;
}
