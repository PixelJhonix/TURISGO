using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Observers;

public class InvoiceObserver(IGenericRepository<Invoice> invoiceRepository, IReservationRepository reservationRepository) : IReservationObserver
{
    public async Task OnReservationUpdatedAsync(ReservationEventDTO evento)
    {
        if (evento.NewStatus == ReservationStatus.Confirmed)
        {
            var reservation = await reservationRepository.GetByIdAsync(evento.ReservationId);
            if (reservation?.Tour?.Agency is null) return;
            var commission = reservation.Tour.Agency.CommissionPercentage;
            var amount = reservation.Tour.Price * (1 - commission / 100m);
            await invoiceRepository.CreateAsync(new Invoice { ReservationId = reservation.Id, Amount = amount, Status = InvoiceStatus.Active });
        }
    }
}
