namespace TuristGo.API.DTOs;

public record GuideResponseDTO(
    int Id,
    string FullName,
    string Email,
    string DocumentNumber,
    string CertificateNumber,
    DateTime CertificateExpiryDate,
    string Status,
    int DaysToExpiry
);
