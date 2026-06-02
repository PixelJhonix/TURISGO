using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuristGo.API.DTOs;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using System.Text.RegularExpressions;

namespace TuristGo.API.Controllers;

[ApiController]
[Authorize(Roles = "Agency")]
[Route("api/vehicle")]
public class VehicleController(IVehicleRepository vehicleRepository) : ControllerBase
{
    // HU-27 CA-01: listar flota de la agencia
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VehicleResponseDTO>>> GetAll()
    {
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var vehicles = await vehicleRepository.GetByAgencyAsync(agencyId);
        return Ok(vehicles.Select(v => new VehicleResponseDTO(
            v.Id, v.LicensePlate, v.Brand, v.Model, v.Year, v.PassengerCapacity, v.Status.ToString())));
    }

    // HU-27 CA-01–03: registrar vehículo con validación de placa
    [HttpPost]
    public async Task<ActionResult> Create([FromBody] VehicleRequestDTO dto)
    {
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");

        // HU-27 CA-03: formato placa colombiana (AAA-000 o ABC123)
        if (!Regex.IsMatch(dto.LicensePlate, @"^[A-Z]{3}-?\d{3}$", RegexOptions.IgnoreCase))
            throw new ArgumentException("Formato de placa inválido. Ejemplo: ABC-123.");

        var vehicle = new Vehicle
        {
            AgencyId = agencyId,
            LicensePlate = dto.LicensePlate.ToUpper(),
            Brand = dto.Brand,
            Model = dto.Model,
            Year = dto.Year,
            PassengerCapacity = dto.PassengerCapacity,
            Status = VehicleStatus.Available,
        };
        var created = await vehicleRepository.CreateAsync(vehicle);
        return Ok(new VehicleResponseDTO(created.Id, created.LicensePlate, created.Brand, created.Model, created.Year, created.PassengerCapacity, created.Status.ToString()));
    }

    // HU-32 CA-01/02: cambiar estado con VEHICLE-03
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult> ChangeStatus(int id, [FromBody] VehicleStatusRequestDTO dto)
    {
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var vehicle = await vehicleRepository.GetByIdAsync(id) ?? throw new KeyNotFoundException("Vehículo no encontrado.");
        if (vehicle.AgencyId != agencyId) throw new UnauthorizedAccessException("El vehículo no pertenece a tu agencia.");

        // VEHICLE-03: no pasar a mantenimiento si tiene tours activos
        var newStatus = dto.Status switch
        {
            "Available" or "Disponible" => VehicleStatus.Available,
            "InMaintenance" or "En mantenimiento" => VehicleStatus.InMaintenance,
            _ => throw new ArgumentException("Estado inválido. Usa: Available o InMaintenance.")
        };

        if (newStatus == VehicleStatus.InMaintenance && await vehicleRepository.HasFutureToursAsync(id))
            throw new InvalidOperationException("No puedes poner en mantenimiento un vehículo con tours futuros activos. Desasígnalo primero.");

        vehicle.Status = newStatus;
        await vehicleRepository.UpdateAsync(vehicle);
        return NoContent();
    }

    // HU-34 CA-01/02: eliminar con validación de tours futuros
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var vehicle = await vehicleRepository.GetByIdAsync(id) ?? throw new KeyNotFoundException("Vehículo no encontrado.");
        if (vehicle.AgencyId != agencyId) throw new UnauthorizedAccessException("El vehículo no pertenece a tu agencia.");

        if (await vehicleRepository.HasFutureToursAsync(id))
            throw new InvalidOperationException("No puedes eliminar un vehículo con tours futuros activos asignados.");

        await vehicleRepository.DeleteAsync(id);
        return NoContent();
    }
}
