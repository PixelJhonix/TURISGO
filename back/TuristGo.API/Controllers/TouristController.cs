using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuristGo.API.DTOs;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Services;

namespace TuristGo.API.Controllers;

[ApiController]
[Authorize(Roles = "Tourist")]
[Route("api/tourist")]
public class TouristController(
    IGenericRepository<User> userStore,
    IUserRepository userRepo,
    AdminService adminService) : ControllerBase
{
    // HU-11 CA-01/02: actualizar perfil (email no editable)
    [HttpPut("profile")]
    public async Task<ActionResult> UpdateProfile([FromBody] UpdateTouristProfileRequestDTO dto)
    {
        var touristId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var user = await userStore.GetByIdAsync(touristId) as Tourist
            ?? throw new KeyNotFoundException("Turista no encontrado.");

        user.FullName = dto.FullName;
        user.Phone = dto.Phone;
        await userStore.UpdateAsync(user);
        return Ok(new { message = "Perfil actualizado correctamente." });
    }

    [HttpGet("profile")]
    public async Task<ActionResult> GetProfile()
    {
        var touristId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var user = await userStore.GetByIdAsync(touristId) as Tourist
            ?? throw new KeyNotFoundException("Turista no encontrado.");
        return Ok(new { user.Id, user.FullName, user.Email, user.Phone });
    }

    // HU-14 CA-01–03: eliminar cuenta con validación contraseña y reservas activas
    [HttpDelete("account")]
    public async Task<ActionResult> DeleteAccount([FromBody] DeleteAccountRequestDTO dto)
    {
        var touristId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var user = await userStore.GetByIdAsync(touristId)
            ?? throw new KeyNotFoundException("Turista no encontrado.");

        // HU-14 CA-03: verificar contraseña
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Contraseña incorrecta.");

        // RN-15/HU-14 CA-02: validación de reservas activas delegada a AdminService
        await adminService.DeleteUserAsync(touristId);
        return Ok(new { message = "Cuenta eliminada correctamente." });
    }
}
