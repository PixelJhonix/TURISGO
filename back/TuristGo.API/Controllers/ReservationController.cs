using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuristGo.API.DTOs;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.API.Controllers;

[ApiController]
[Authorize]
[Route("api/reservation")]
public class ReservationController(
    IReservationFacade facade,
    IReservationRepository reservationRepo,
    IReviewRepository reviewRepo,
    IGenericRepository<Review> reviewStore,
    ITourRepository tourRepo) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = "Tourist")]
    public async Task<ActionResult> Create(ReservationRequestDTO dto)
    {
        var touristId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var model = new ConfirmReservationModel(
            dto.TourId,
            DateOnly.Parse(dto.TourDate),
            dto.TourScheduleId,
            dto.StartTime is null ? null : TimeOnly.Parse(dto.StartTime),
            dto.EndTime is null ? null : TimeOnly.Parse(dto.EndTime));
        var reservation = await facade.ConfirmBookingAsync(model, touristId);
        return Ok(new { reservation.Id, ReservationNumber = $"RES-{reservation.CreatedAt:yyyy}-{reservation.Id:D6}", message = "Reserva confirmada." });
    }

    // HU-39: historial de reservas del turista autenticado
    [HttpGet("my")]
    [Authorize(Roles = "Tourist")]
    public async Task<ActionResult<IEnumerable<ReservationResponseDTO>>> GetMine()
    {
        var touristId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var items = await facade.GetByTouristAsync(touristId);
        return Ok(items.Select(r => new ReservationResponseDTO(
            r.Id,
            $"RES-{r.CreatedAt:yyyy}-{r.Id:D6}",
            r.TourId,
            r.Tour?.Name ?? "",
            r.Tour?.Agency?.CommercialName ?? "",
            r.TourDate.ToString("yyyy-MM-dd"),
            r.Status.ToString(),
            r.Tour?.Price ?? 0)));
    }

    [HttpPatch("{id:int}/cancel")]
    [Authorize(Roles = "Tourist")]
    public async Task<ActionResult> Cancel(int id)
    {
        var touristId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        await facade.CancelBookingAsync(id, touristId);
        return Ok(new { message = "Reserva cancelada. La factura ha sido anulada." });
    }

    // HU-42: completar reserva (agencia)
    [HttpPatch("{id:int}/complete")]
    [Authorize(Roles = "Agency")]
    public async Task<ActionResult> Complete(int id)
    {
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        await facade.CompleteBookingAsync(id, agencyId);
        return Ok(new { message = "Reserva marcada como completada." });
    }

    // HU-40: reservas de la agencia autenticada
    [HttpGet("agency")]
    [Authorize(Roles = "Agency")]
    public async Task<ActionResult<IEnumerable<ReservationResponseDTO>>> GetAgencyReservations()
    {
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var items = await facade.GetByAgencyAsync(agencyId);
        return Ok(items.Select(r => new ReservationResponseDTO(
            r.Id,
            $"RES-{r.CreatedAt:yyyy}-{r.Id:D6}",
            r.TourId,
            r.Tour?.Name ?? "",
            r.Tour?.Agency?.CommercialName ?? "",
            r.TourDate.ToString("yyyy-MM-dd"),
            r.Status.ToString(),
            r.Tour?.Price ?? 0)));
    }

    // HU-43: cambio de fecha de reserva (>24h, nueva fecha futura)
    [HttpPatch("{id:int}/reschedule")]
    [Authorize(Roles = "Tourist")]
    public async Task<ActionResult> Reschedule(int id, [FromBody] RescheduleRequestDTO dto)
    {
        var touristId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var newDate = DateOnly.Parse(dto.NewDate);
        await facade.RescheduleBookingAsync(id, touristId, newDate);
        return Ok(new { message = "Fecha de reserva actualizada." });
    }

    // HU-55 CA-01–03: calificar tour — solo reservas Completed, una vez por reserva
    [HttpPost("{id:int}/review")]
    [Authorize(Roles = "Tourist")]
    public async Task<ActionResult> Review(int id, [FromBody] ReviewRequestDTO dto)
    {
        if (dto.Rating < 1 || dto.Rating > 5)
            throw new ArgumentException("La calificación debe estar entre 1 y 5 estrellas.");

        var reservation = await reservationRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Reserva no encontrada.");

        var touristId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        if (reservation.TouristId != touristId)
            throw new UnauthorizedAccessException("La reserva no pertenece a este usuario.");

        // HU-55 CA-03: solo reservas completadas
        if (reservation.Status != ReservationStatus.Completed)
            throw new InvalidOperationException("Solo puedes calificar tours de reservas completadas.");

        // HU-55 CA-02: una sola reseña por reserva (índice único en BD)
        if (await reviewRepo.ExistsByReservationAsync(id))
            throw new InvalidOperationException("Ya enviaste una calificación para esta reserva.");

        await reviewStore.CreateAsync(new Review
        {
            ReservationId = id,
            Rating = dto.Rating,
            Comment = dto.Comment,
        });

        // Recalcular AverageRating del tour
        var tour = await tourRepo.GetByIdAsync(reservation.TourId);
        if (tour is not null)
        {
            var allReviews = await reviewRepo.GetAllAsync();
            var tourReviews = allReviews.Where(r => r.Reservation?.TourId == reservation.TourId || r.ReservationId == id).ToList();
            var avg = tourReviews.Count > 0 ? (decimal)tourReviews.Average(r => r.Rating) : dto.Rating;
            tour.AverageRating = Math.Round(avg, 2);
            await tourRepo.UpdateAsync(tour);
        }

        return Ok(new { message = "¡Gracias por tu calificación!" });
    }
}
