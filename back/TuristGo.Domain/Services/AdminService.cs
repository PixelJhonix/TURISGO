using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services;

public class AdminService(
    IGenericRepository<User> userRepository,
    IReservationRepository reservationRepository,
    IEnumerable<IAgencyObserver> observers)
{
    // HU-13 CA-01: suspender con motivo (guardado en SuspensionReason para auditoría)
    public async Task SuspendUserAsync(User user, string reason)
    {
        user.Status = UserStatus.Suspended;
        user.SuspensionReason = reason;
        await userRepository.UpdateAsync(user);
        if (user.Role == UserRole.Agency)
        {
            foreach (var observer in observers) await observer.OnAgencySuspendedAsync(user.Id);
        }
    }

    // HU-09 CA-03 / HU-13 CA-02/03: eliminar con validaciones RN-15/16
    public async Task DeleteUserAsync(int userId)
    {
        var user = await userRepository.GetByIdAsync(userId) ?? throw new KeyNotFoundException("Usuario no encontrado");

        // RN-15: turista no eliminable con reservas confirmadas o completadas
        if (user.Role == UserRole.Tourist)
        {
            var reservations = await reservationRepository.GetByTouristAsync(userId);
            var hasActive = reservations.Any(r =>
                r.Status == ReservationStatus.Confirmed || r.Status == ReservationStatus.Completed);
            if (hasActive)
                throw new InvalidOperationException("No puedes eliminar un turista con reservas activas o completadas.");
        }

        // RN-16: agencia no eliminable con tours activos
        if (user.Role == UserRole.Agency)
        {
            var agencyReservations = await reservationRepository.GetByAgencyAsync(userId);
            var hasActiveReservations = agencyReservations.Any(r => r.Status == ReservationStatus.Confirmed);
            if (hasActiveReservations)
                throw new InvalidOperationException("No puedes eliminar una agencia con reservas activas confirmadas.");
        }

        await userRepository.DeleteAsync(userId);
    }
}
