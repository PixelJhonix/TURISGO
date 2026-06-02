using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuristGo.API.DTOs;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;

namespace TuristGo.API.Controllers;

[ApiController]
[Route("api/tour")]
public class TourController(ITourRepository tourRepository, IMapper mapper) : ControllerBase
{
    // HU-21 CA-01: solo tours activos para el catálogo público
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TourResponseDTO>>> GetAll([FromQuery] string? category, [FromQuery] string? city)
    {
        var tours = await tourRepository.GetAllAsync();
        var active = tours.Where(t => t.Status == TourStatus.Active);
        if (!string.IsNullOrWhiteSpace(category))
            active = active.Where(t => t.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(city))
            active = active.Where(t => t.City.Equals(city, StringComparison.OrdinalIgnoreCase));
        return Ok(mapper.Map<IEnumerable<TourResponseDTO>>(active));
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TourResponseDTO>> GetById(int id)
    {
        var tour = await tourRepository.GetByIdAsync(id);
        return tour is null ? NotFound() : Ok(mapper.Map<TourResponseDTO>(tour));
    }

    // HU-17 CA-01: crear tour con código único, estado inicial Inactive
    [Authorize(Roles = "Agency")]
    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateTourRequestDTO dto)
    {
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        // TOUR-02: precio > 0
        if (dto.Price <= 0) throw new ArgumentException("El precio debe ser mayor a 0.");
        // HU-17 CA-04: cupos válidos
        if (dto.TotalCapacity <= 0) throw new ArgumentException("Los cupos deben ser mayores a 0.");

        var tour = new Tour
        {
            AgencyId = agencyId,
            Code = $"TG-{DateTime.UtcNow:yyyyMMddHHmmss}-{new Random().Next(100, 999)}",
            Name = dto.Name,
            Description = dto.Description,
            Category = dto.Category,
            City = dto.City,
            Price = dto.Price,
            TotalCapacity = dto.TotalCapacity,
            AvailableCapacity = dto.TotalCapacity,
            StartTime = dto.StartTime,
            DurationMinutes = dto.DurationMinutes,
            MeetingPoint = dto.MeetingPoint,
            Status = TourStatus.Inactive, // HU-17 CA-02: inactivo hasta tener guía
            ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl,
        };
        var created = await tourRepository.CreateAsync(tour);
        return Ok(new { created.Id, created.Code, message = "Tour creado. Asigna un guía para activarlo." });
    }

    // HU-23 CA-01/02: editar sin reducir cupos bajo reservas existentes
    [Authorize(Roles = "Agency")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, [FromBody] CreateTourRequestDTO dto)
    {
        var tour = await tourRepository.GetByIdAsync(id) ?? throw new KeyNotFoundException("Tour no encontrado");
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        if (tour.AgencyId != agencyId) throw new UnauthorizedAccessException("No tienes permiso para editar este tour.");

        // HU-23 CA-02: no reducir cupos por debajo de reservas activas
        var occupiedSpots = tour.TotalCapacity - tour.AvailableCapacity;
        if (dto.TotalCapacity < occupiedSpots)
            throw new ArgumentException($"No puedes reducir los cupos a menos de {occupiedSpots} (reservas existentes).");

        if (dto.Price <= 0) throw new ArgumentException("El precio debe ser mayor a 0.");

        tour.Name = dto.Name;
        tour.Description = dto.Description;
        tour.Category = dto.Category;
        tour.City = dto.City;
        tour.Price = dto.Price;
        tour.AvailableCapacity = tour.AvailableCapacity + (dto.TotalCapacity - tour.TotalCapacity);
        tour.TotalCapacity = dto.TotalCapacity;
        tour.StartTime = dto.StartTime;
        tour.DurationMinutes = dto.DurationMinutes;
        tour.MeetingPoint = dto.MeetingPoint;
        if (!string.IsNullOrWhiteSpace(dto.ImageUrl)) tour.ImageUrl = dto.ImageUrl;

        await tourRepository.UpdateAsync(tour);
        return NoContent();
    }

    // HU-25 CA-01/02: desactivar sólo si no hay reservas futuras Confirmed
    [Authorize(Roles = "Agency,Admin")]
    [HttpPatch("{id:int}/deactivate")]
    public async Task<ActionResult> Deactivate(int id, [FromBody] DeactivateTourRequestDTO dto)
    {
        var tour = await tourRepository.GetByIdAsync(id) ?? throw new KeyNotFoundException("Tour no encontrado");
        var hasFutureReservations = await tourRepository.HasFutureConfirmedReservationsAsync(id);
        if (hasFutureReservations)
            throw new InvalidOperationException("No puedes desactivar un tour con reservas confirmadas futuras.");

        tour.Status = TourStatus.Inactive;
        tour.DeactivationReason = dto.Reason;
        await tourRepository.UpdateAsync(tour);
        return NoContent();
    }

    // HU-19 CA-01–05: asignar guía con todas las validaciones GoF
    [Authorize(Roles = "Agency")]
    [HttpPost("{id:int}/guides")]
    public async Task<ActionResult> AssignGuide(int id, [FromBody] AssignGuideRequestDTO dto)
    {
        var tour = await tourRepository.GetByIdAsync(id) ?? throw new KeyNotFoundException("Tour no encontrado.");
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        if (tour.AgencyId != agencyId) throw new UnauthorizedAccessException("El tour no pertenece a tu agencia.");

        var guide = await tourRepository.GetGuideForAssignmentAsync(dto.GuideId, tour.StartTime, tour.DurationMinutes)
            ?? throw new KeyNotFoundException("Guía no encontrado.");

        // GUIDE-01: certificado vigente
        if (guide.CertificateExpiryDate <= DateTime.UtcNow)
            throw new InvalidOperationException("El guía tiene el certificado vencido y no puede ser asignado.");

        // GUIDE-03: tour con menos de 24h
        if (tour.StartTime <= DateTime.UtcNow.AddHours(24))
            throw new InvalidOperationException("No puedes asignar un guía a un tour que empieza en menos de 24 horas.");

        // GUIDE-04: cruce horario (chequeo de otros tours del guía el mismo día)
        var hasConflict = await tourRepository.GuideHasScheduleConflictAsync(dto.GuideId, id, tour.StartTime, tour.DurationMinutes);
        if (hasConflict)
            throw new InvalidOperationException("El guía tiene un conflicto de horario con otro tour asignado.");

        tour.GuideId = dto.GuideId;
        // Tour puede activarse si también tiene vehículo (PuedeActivarse)
        if (tour.VehicleId.HasValue) tour.Status = TourStatus.Active;
        await tourRepository.UpdateAsync(tour);
        return Ok(new { message = "Guía asignado.", tourStatus = tour.Status.ToString() });
    }

    // HU-28B CA-01–04: asignar vehículo con validaciones VEHICLE-01/02
    [Authorize(Roles = "Agency")]
    [HttpPost("{id:int}/vehicle")]
    public async Task<ActionResult> AssignVehicle(int id, [FromBody] AssignVehicleRequestDTO dto)
    {
        var tour = await tourRepository.GetByIdAsync(id) ?? throw new KeyNotFoundException("Tour no encontrado.");
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        if (tour.AgencyId != agencyId) throw new UnauthorizedAccessException("El tour no pertenece a tu agencia.");

        var vehicle = await tourRepository.GetVehicleForAssignmentAsync(dto.VehicleId)
            ?? throw new KeyNotFoundException("Vehículo no encontrado.");

        // VEHICLE-01: debe estar disponible
        if (vehicle.Status != VehicleStatus.Available)
            throw new InvalidOperationException("El vehículo no está disponible (está asignado o en mantenimiento).");

        // VEHICLE-02: capacidad >= cupos del tour
        if (vehicle.PassengerCapacity < tour.TotalCapacity)
            throw new InvalidOperationException($"El vehículo tiene capacidad para {vehicle.PassengerCapacity} pasajeros pero el tour requiere {tour.TotalCapacity}.");

        tour.VehicleId = dto.VehicleId;
        vehicle.Status = VehicleStatus.Assigned;
        if (tour.GuideId.HasValue) tour.Status = TourStatus.Active;
        await tourRepository.UpdateAsync(tour);
        await tourRepository.UpdateVehicleAsync(vehicle);
        return Ok(new { message = "Vehículo asignado.", tourStatus = tour.Status.ToString() });
    }

    [Authorize(Roles = "Agency")]
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult> SetStatus(int id, [FromBody] TourStatusUpdateRequestDTO dto)
    {
        var tour = await tourRepository.GetByIdAsync(id);
        if (tour is null) return NotFound();
        tour.Status = dto.Status is "Active" or "Activo" ? TourStatus.Active : TourStatus.Inactive;
        await tourRepository.UpdateAsync(tour);
        return NoContent();
    }
}
