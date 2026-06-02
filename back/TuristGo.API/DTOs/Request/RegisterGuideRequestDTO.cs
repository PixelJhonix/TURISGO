namespace TuristGo.API.DTOs;

public record RegisterGuideRequestDTO(
    string FullName,
    string Email,
    string Password,
    string DocumentNumber,
    string CertificateNumber,
    DateTime CertificateExpiryDate
);
