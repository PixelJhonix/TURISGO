using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Interfaces.Repositories;

namespace TuristGo.API.Controllers;

[ApiController]
[Authorize(Roles = "Agency")]
[Route("api/vehicle")]
public class VehicleController(IGenericRepository<Vehicle> vehicleRepository) : ControllerBase
{
    [HttpGet] public async Task<ActionResult> GetAll() => Ok(await vehicleRepository.GetAllAsync());
    [HttpPost] public async Task<ActionResult> Create(Vehicle entity) => Ok(await vehicleRepository.CreateAsync(entity));
    [HttpPut("{id:int}")] public async Task<ActionResult> Update(int id, Vehicle entity) { entity.Id = id; await vehicleRepository.UpdateAsync(entity); return NoContent(); }
    [HttpPatch("{id:int}/status")] public ActionResult ChangeStatus(int id) => NoContent();
    [HttpDelete("{id:int}")] public async Task<ActionResult> Delete(int id) { await vehicleRepository.DeleteAsync(id); return NoContent(); }
}
