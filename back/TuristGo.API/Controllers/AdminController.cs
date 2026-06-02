using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuristGo.API.DTOs;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Services;

namespace TuristGo.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController(
    IGenericRepository<User> userRepository,
    AdminService adminService,
    IUserRepository users) : ControllerBase
{
    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<AdminUserResponseDTO>>> GetUsers()
    {
        var items = await users.GetAllUsersAsync();
        var result = items.Select(u =>
        {
            var name =
                u is Agency a ? a.CommercialName :
                u is Tourist t ? t.FullName :
                u is Guide g ? g.FullName :
                u is Admin ? "Admin" :
                u.Email.Split('@')[0];

            decimal? commission = u is Agency agency ? agency.CommissionPercentage : null;
            return new AdminUserResponseDTO(u.Id, name, u.Email, u.Role.ToString(), u.Status.ToString(), commission);
        });

        return Ok(result);
    }

    [HttpPatch("agencies/{id:int}/approve")]
    public async Task<ActionResult> ApproveAgency(int id, [FromBody] ApproveAgencyRequestDTO dto)
    {
        var user = await userRepository.GetByIdAsync(id);
        if (user is not Agency agency) return NotFound();
        agency.Status = UserStatus.Active;
        agency.CommissionPercentage = dto.CommissionPercentage;
        await userRepository.UpdateAsync(agency);
        return NoContent();
    }

    // HU-13 CA-01: motivo obligatorio en suspensión
    [HttpPatch("users/{id:int}/suspend")]
    public async Task<ActionResult> SuspendUser(int id, [FromBody] SuspendUserRequestDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new ArgumentException("El motivo de la suspensión es obligatorio.");
        var user = await userRepository.GetByIdAsync(id);
        if (user is null) return NotFound();
        await adminService.SuspendUserAsync(user, dto.Reason);
        return NoContent();
    }

    // Reactivar usuario suspendido
    [HttpPatch("users/{id:int}/reactivate")]
    public async Task<ActionResult> ReactivateUser(int id)
    {
        var user = await userRepository.GetByIdAsync(id);
        if (user is null) return NotFound();
        user.Status = UserStatus.Active;
        user.SuspensionReason = null;
        await userRepository.UpdateAsync(user);
        return NoContent();
    }

    // HU-09 CA-03 / HU-13 CA-02/03: eliminar usuario con validaciones RN-15/16
    [HttpDelete("users/{id:int}")]
    public async Task<ActionResult> DeleteUser(int id)
    {
        var user = await userRepository.GetByIdAsync(id);
        if (user is null) return NotFound();
        await adminService.DeleteUserAsync(id);
        return NoContent();
    }
}
