using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Facades;

public class ReservationFacade(
    IReservationRepository reservationRepository,
    ITourRepository tourRepository,
    IGenericRepository<Invoice> invoiceRepository,
    IEnumerable<IReservationObserver> observers) : IReservationFacade
{
    public async Task<Reservation> ConfirmBookingAsync(ConfirmReservationModel request, int touristId)
    {
        var tour = await tourRepository.GetByIdAsync(request.TourId) ?? throw new KeyNotFoundException("Tour no encontrado");

        // HU-35 CA-01: no reservar tours con fecha pasada
        if (request.TourDate < DateOnly.FromDateTime(DateTime.UtcNow))
            throw new InvalidOperationException("No puedes reservar un tour cuya fecha ya pasó.");

        // HU-35 CA-02: sin cupos
        if (tour.AvailableCapacity <= 0) throw new InvalidOperationException("Sin cupos disponibles para este tour.");

        // HU-35 CA-03 / HU-38 CA-01: cruce horario del turista
        if (request.StartTime.HasValue && request.EndTime.HasValue)
        {
            var existing = await reservationRepository.GetByTouristAsync(touristId);
            var conflict = existing.FirstOrDefault(r =>
                r.Status == ReservationStatus.Confirmed &&
                r.TourDate == request.TourDate &&
                r.StartTime.HasValue && r.EndTime.HasValue &&
                r.StartTime < request.EndTime && r.EndTime > request.StartTime);

            if (conflict is not null)
            {
                var conflictTour = await tourRepository.GetByIdAsync(conflict.TourId);
                throw new InvalidOperationException(
                    $"Conflicto de horario con el tour '{conflictTour?.Name}' ({conflict.StartTime:hh\\:mm}-{conflict.EndTime:hh\\:mm}). Elige otro horario.");
            }
        }

        var reservation = await reservationRepository.CreateAsync(new Reservation
        {
            TouristId = touristId,
            TourId = request.TourId,
            TourDate = request.TourDate,
            TourScheduleId = request.TourScheduleId,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = ReservationStatus.Confirmed,
        });

        foreach (var observer in observers)
            await observer.OnReservationUpdatedAsync(new ReservationEventDTO(reservation.Id, reservation.Status, reservation.TourId, reservation.TouristId));

        return reservation;
    }

    public async Task<Reservation> CancelBookingAsync(int reservationId, int touristId)
    {
        var reservation = await reservationRepository.GetByIdAsync(reservationId) ?? throw new KeyNotFoundException("Reserva no encontrada");
        if (reservation.TouristId != touristId) throw new UnauthorizedAccessException("La reserva no pertenece a este usuario.");

        // HU-44 CA-02: no cancelar completadas
        if (reservation.Status == ReservationStatus.Completed)
            throw new InvalidOperationException("No puedes cancelar una reserva ya completada.");
        // HU-44 CA-03: no cancelar ya canceladas
        if (reservation.Status == ReservationStatus.Cancelled)
            throw new InvalidOperationException("La reserva ya está cancelada.");

        // RN-08: ventana mínima de 24h antes del tour
        var tourStart = reservation.TourDate.ToDateTime(reservation.StartTime ?? TimeOnly.MinValue);
        if (tourStart <= DateTime.UtcNow.AddHours(24))
            throw new InvalidOperationException("Solo puedes cancelar con más de 24 horas de anticipación.");

        reservation.Status = ReservationStatus.Cancelled;
        await reservationRepository.UpdateAsync(reservation);

        // RN-18: anular la factura asociada
        var invoice = await reservationRepository.GetInvoiceByReservationAsync(reservationId);
        if (invoice is not null)
        {
            invoice.Status = InvoiceStatus.Voided;
            await invoiceRepository.UpdateAsync(invoice);
        }

        foreach (var observer in observers)
            await observer.OnReservationUpdatedAsync(new ReservationEventDTO(reservation.Id, reservation.Status, reservation.TourId, reservation.TouristId));

        return reservation;
    }

    // HU-42 CA-01/02: marcar como completada (solo agencia, solo si fecha pasada)
    public async Task<Reservation> CompleteBookingAsync(int reservationId, int agencyId)
    {
        var reservation = await reservationRepository.GetByIdAsync(reservationId) ?? throw new KeyNotFoundException("Reserva no encontrada");

        if (reservation.Tour?.AgencyId != agencyId)
            throw new UnauthorizedAccessException("Esta reserva no pertenece a tu agencia.");

        if (reservation.Status != ReservationStatus.Confirmed)
            throw new InvalidOperationException("Solo se pueden completar reservas confirmadas.");

        // RES-06: la fecha del tour debe haber pasado
        var tourDateTime = reservation.TourDate.ToDateTime(reservation.EndTime ?? TimeOnly.MaxValue);
        if (tourDateTime > DateTime.UtcNow)
            throw new InvalidOperationException("No puedes completar una reserva cuyo tour aún no ha ocurrido.");

        reservation.Status = ReservationStatus.Completed;
        await reservationRepository.UpdateAsync(reservation);

        foreach (var observer in observers)
            await observer.OnReservationUpdatedAsync(new ReservationEventDTO(reservation.Id, reservation.Status, reservation.TourId, reservation.TouristId));

        return reservation;
    }

    // HU-43: cambio de fecha de reserva (>24h antes de la fecha original, nueva fecha futura)
    public async Task<Reservation> RescheduleBookingAsync(int reservationId, int touristId, DateOnly newDate)
    {
        var reservation = await reservationRepository.GetByIdAsync(reservationId)
            ?? throw new KeyNotFoundException("Reserva no encontrada.");
        if (reservation.TouristId != touristId)
            throw new UnauthorizedAccessException("La reserva no pertenece a este usuario.");
        if (reservation.Status != ReservationStatus.Confirmed)
            throw new InvalidOperationException("Solo se pueden reprogramar reservas confirmadas.");

        var originalStart = reservation.TourDate.ToDateTime(reservation.StartTime ?? TimeOnly.MinValue);
        if (originalStart <= DateTime.UtcNow.AddHours(24))
            throw new InvalidOperationException("Solo puedes cambiar la fecha con más de 24 horas de anticipación.");
        if (newDate <= DateOnly.FromDateTime(DateTime.UtcNow))
            throw new InvalidOperationException("La nueva fecha debe ser futura.");

        reservation.TourDate = newDate;
        await reservationRepository.UpdateAsync(reservation);
        return reservation;
    }

    // HU-39: historial del turista
    public Task<IEnumerable<Reservation>> GetByTouristAsync(int touristId)
        => reservationRepository.GetByTouristAsync(touristId);

    // HU-40: reservas de la agencia
    public Task<IEnumerable<Reservation>> GetByAgencyAsync(int agencyId)
        => reservationRepository.GetByAgencyAsync(agencyId);
}
