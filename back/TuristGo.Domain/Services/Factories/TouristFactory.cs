using System.Text.RegularExpressions;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Factories;

public class TouristFactory : IUsuarioFactory
{
    // HU-01 CA-03: mínimo 8 chars, una mayúscula y un número
    private static readonly Regex PasswordRule = new(@"^(?=.*[A-Z])(?=.*\d).{8,}$");

    public User Create(RegisterRequestModel request)
    {
        if (!PasswordRule.IsMatch(request.Password))
            throw new ArgumentException("La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.");

        return new Tourist
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            Role = UserRole.Tourist,
            Status = UserStatus.Active,
        };
    }
}
