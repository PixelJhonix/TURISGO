using TuristGo.Domain.Enums;

namespace TuristGo.Domain.Interfaces.Services;

public record RegisterRequestModel(string Email, string Password, UserRole Role, string FullName, string? NIT, DateTime? CertificateExpiryDate, string? CertificateNumber, int? AgencyId);
