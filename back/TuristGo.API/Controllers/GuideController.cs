using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuristGo.API.DTOs;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;

namespace TuristGo.API.Controllers;

[ApiController]
[Authorize(Roles = "Guide")]
[Route("api/guide")]
public class GuideController(
    ITourRepository tourRepository,
    IReservationRepository reservationRepository,
    IGenericRepository<GuideUnavailability> unavailabilityRepo) : ControllerBase
{
    // HU-22 CA-01/02: tours asignados al guía autenticado
    [HttpGet("tours")]
    public async Task<ActionResult<IEnumerable<AssignedTourResponseDTO>>> GetTours()
    {
        var guideId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var tours = await tourRepository.GetByGuideAsync(guideId);
        return Ok(tours.Select(t => new AssignedTourResponseDTO(
            t.Id, t.Code, t.Name, t.Category, t.City,
            t.StartTime, t.DurationMinutes, t.MeetingPoint, t.Status.ToString(),
            t.TotalCapacity, t.AvailableCapacity,
            t.Vehicle is null ? null : new AssignedTourVehicleDTO(
                t.Vehicle.Id, t.Vehicle.LicensePlate, t.Vehicle.Brand,
                t.Vehicle.Model, t.Vehicle.PassengerCapacity))));
    }

    // HU-24 CA-01–03: registrar período de no disponibilidad
    [HttpPost("unavailability")]
    public async Task<ActionResult> AddUnavailability([FromBody] UnavailabilityRequestDTO dto)
    {
        var guideId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");

        // HU-24 CA-02: no fechas pasadas
        if (dto.StartDateTime < DateTime.UtcNow)
            throw new ArgumentException("La fecha de inicio no puede ser en el pasado.");
        if (dto.EndDateTime <= dto.StartDateTime)
            throw new ArgumentException("La fecha de fin debe ser posterior a la de inicio.");

        // HU-24 CA-03: no conflicto con tours ya asignados
        var assignedTours = await tourRepository.GetByGuideAsync(guideId);
        var conflict = assignedTours.FirstOrDefault(t =>
            t.StartTime < dto.EndDateTime &&
            t.StartTime.AddMinutes(t.DurationMinutes) > dto.StartDateTime);

        if (conflict is not null)
            throw new InvalidOperationException(
                $"El período de no disponibilidad se solapa con el tour '{conflict.Name}' asignado el {conflict.StartTime:dd/MM/yyyy}.");

        var unavailability = await unavailabilityRepo.CreateAsync(new GuideUnavailability
        {
            GuideId = guideId,
            StartDateTime = dto.StartDateTime,
            EndDateTime = dto.EndDateTime,
        });

        return Ok(new UnavailabilityResponseDTO(unavailability.Id, unavailability.StartDateTime, unavailability.EndDateTime));
    }

    // HU-41: turistas confirmados en un tour asignado al guía
    [HttpGet("tours/{tourId:int}/tourists")]
    public async Task<ActionResult> GetTouristsInTour(int tourId)
    {
        var guideId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var tour = await tourRepository.GetByIdAsync(tourId);
        if (tour is null || tour.GuideId != guideId) return Forbid();

        var reservations = await reservationRepository.GetByTourAsync(tourId);
        var result = reservations
            .Where(r => r.Status == ReservationStatus.Confirmed)
            .Select(r => new
            {
                r.Id,
                TouristName = r.Tourist?.FullName ?? "",
                TourDate = r.TourDate.ToString("yyyy-MM-dd"),
            });
        return Ok(result);
    }

    // HU-24: eliminar período de no disponibilidad
    [HttpDelete("unavailability/{id:int}")]
    public async Task<ActionResult> DeleteUnavailability(int id)
    {
        var guideId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var item = await unavailabilityRepo.GetByIdAsync(id);
        if (item is null) return NotFound();
        if (item.GuideId != guideId) return Forbid();
        await unavailabilityRepo.DeleteAsync(id);
        return NoContent();
    }
}
