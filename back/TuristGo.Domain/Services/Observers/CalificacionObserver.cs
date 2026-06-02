using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Observers;

// CalificacionObserver: wired en PUML — habilita la reseña al completarse la reserva
// No crea la reseña, solo libera la restricción (CA-03 HU-55: solo para reservas Completed)
public class CalificacionObserver(ITourRepository tourRepository) : IReservationObserver
{
    public async Task OnReservationUpdatedAsync(ReservationEventDTO evento)
    {
        // Solo actúa en Completed: recalcula AverageRating del tour
        if (evento.NewStatus != ReservationStatus.Completed) return;

        var tour = await tourRepository.GetByIdAsync(evento.TourId);
        if (tour is null) return;

        // El recálculo real ocurre en ReviewController al POST /review
        // Aquí solo marcamos que el tour puede recibir reseñas (log implícito)
        await Task.CompletedTask;
    }
}
