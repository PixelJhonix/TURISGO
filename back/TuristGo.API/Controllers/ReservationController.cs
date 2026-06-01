using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuristGo.API.DTOs;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.API.Controllers;

[ApiController]
[Authorize]
[Route("api/reservation")]
public class ReservationController(IReservationFacade facade) : ControllerBase
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
            r.TourDate.ToString("yyyy-MM-dd"),
            r.Status.ToString(),
            r.Tour?.Price ?? 0)));
    }

    [HttpPost("{id:int}/review")] public ActionResult Review(int id) => Ok();
}
