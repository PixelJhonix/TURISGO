using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuristGo.API.DTOs;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Interfaces.Services;
using TuristGo.Domain.Services;
using TuristGo.Domain.Services.Factories;

namespace TuristGo.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService, Dictionary<UserRole, IUsuarioFactory> factorySelector, IGenericRepository<User> userStore, IUserRepository userRepo) : ControllerBase
{
    [HttpPost("register/tourist")]
    public async Task<ActionResult> RegisterTourist(RegisterTouristRequestDTO dto)
    {
        // HU-01 CA-02: email único
        if (await userRepo.GetByEmailAsync(dto.Email) is not null)
            throw new InvalidOperationException("El correo ya está registrado.");

        var user = factorySelector[UserRole.Tourist].Create(new(dto.Email, dto.Password, UserRole.Tourist, dto.FullName, null, null, null, null));
        await userStore.CreateAsync(user);
        return Ok(new { message = "Registro exitoso. Ya puedes iniciar sesión." });
    }

    [HttpPost("register/agency")]
    public async Task<ActionResult> RegisterAgency(RegisterAgencyRequestDTO dto)
    {
        // HU-02 CA-03: email único
        if (await userRepo.GetByEmailAsync(dto.Email) is not null)
            throw new InvalidOperationException("El correo ya está registrado.");

        var user = factorySelector[UserRole.Agency].Create(new(dto.Email, dto.Password, UserRole.Agency, dto.CommercialName, dto.Nit, null, null, null));
        await userStore.CreateAsync(user);
        return Ok(new { message = "Solicitud enviada. Recibirás respuesta en 24-48 horas." });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDTO>> Login(LoginRequestDTO dto)
    {
        var result = await authService.LoginAsync(new(dto.Email, dto.Password));
        return Ok(new AuthResponseDTO(result.Success, result.Token, result.Role, result.RedirectUrl, result.AlertMessage, result.ErrorMessage));
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult Me() => Ok(new
    {
        id = User.FindFirst("UserId")?.Value,
        email = User.FindFirst("Email")?.Value,
        role = User.FindFirst("Role")?.Value,
    });
}
