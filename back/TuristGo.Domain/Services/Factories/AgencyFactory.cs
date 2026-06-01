using System.Text.RegularExpressions;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Factories;

public class AgencyFactory : IUsuarioFactory
{
    // HU-02 CA-02: formato NIT colombiano XXXXXXXXX-D (9 dígitos, guion, 1 dígito)
    private static readonly Regex NitRule = new(@"^\d{9}-\d$");
    private static readonly Regex PasswordRule = new(@"^(?=.*[A-Z])(?=.*\d).{8,}$");

    public User Create(RegisterRequestModel request)
    {
        if (string.IsNullOrWhiteSpace(request.NIT))
            throw new ArgumentException("NIT es obligatorio.");

        if (!NitRule.IsMatch(request.NIT))
            throw new ArgumentException("El NIT debe tener el formato 900123456-7.");

        if (!PasswordRule.IsMatch(request.Password))
            throw new ArgumentException("La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.");

        return new Agency
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            CommercialName = request.FullName,
            NIT = request.NIT,
            Role = UserRole.Agency,
            Status = UserStatus.Pending,
            CommissionPercentage = 10,
        };
    }
}
