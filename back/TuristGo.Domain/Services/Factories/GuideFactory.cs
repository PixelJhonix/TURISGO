using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Factories;

public class GuideFactory(IUserRepository userRepository) : IUsuarioFactory
{
    public User Create(RegisterRequestModel request)
    {
        if (!request.CertificateExpiryDate.HasValue || request.CertificateExpiryDate <= DateTime.UtcNow)
            throw new InvalidOperationException("Certificado expirado");
        if (string.IsNullOrWhiteSpace(request.CertificateNumber))
            throw new InvalidOperationException("Numero de certificado requerido");

        return new Guide
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            Role = UserRole.Guide,
            Status = UserStatus.Active,
            AgencyId = request.AgencyId ?? 0,
            CertificateExpiryDate = request.CertificateExpiryDate.Value,
            CertificateNumber = request.CertificateNumber,
            DocumentNumber = Guid.NewGuid().ToString("N")[..10],
        };
    }
}
