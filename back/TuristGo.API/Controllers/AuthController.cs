using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
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

    // HU-15 CA-01–04: solicitar recuperación de contraseña (sin SMTP — token en JSON para dev)
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ForgotPasswordResponseDTO>> ForgotPassword([FromBody] ForgotPasswordRequestDTO dto)
    {
        var user = await userRepo.GetByEmailAsync(dto.Email);
        // CA-04: respuesta idéntica si el email no existe (no revelar datos)
        if (user is null)
            return Ok(new ForgotPasswordResponseDTO("", "", "Si el correo está registrado recibirás instrucciones."));

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.PasswordResetToken = HashHelper.Sha256(token);
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(30);
        await userStore.UpdateAsync(user);

        var expiresAt = user.PasswordResetTokenExpiry.Value.ToString("yyyy-MM-ddTHH:mm:ssZ");
        return Ok(new ForgotPasswordResponseDTO(token, expiresAt, "Token generado. En producción se enviaría por correo."));
    }

    // HU-15 CA-02/03/05: validar token y establecer nueva contraseña
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordRequestDTO dto)
    {
        var allUsers = await userStore.GetAllAsync();
        var user = allUsers.FirstOrDefault(u =>
            u.PasswordResetTokenExpiry > DateTime.UtcNow &&
            u.PasswordResetToken == HashHelper.Sha256(dto.Token));

        if (user is null)
            throw new ArgumentException("El enlace de recuperación es inválido o ha expirado.");

        if (dto.NewPassword.Length < 8 ||
            !dto.NewPassword.Any(char.IsUpper) ||
            !dto.NewPassword.Any(char.IsDigit))
            throw new ArgumentException("La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        await userStore.UpdateAsync(user);
        return Ok(new { message = "Contraseña actualizada correctamente." });
    }
}
