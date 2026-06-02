using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuristGo.API.DTOs;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Interfaces.Services;
using TuristGo.Domain.Services.Factories;
using TuristGo.Domain.Entities;

namespace TuristGo.API.Controllers;

[ApiController]
[Authorize(Roles = "Agency")]
[Route("api/agency")]
public class AgencyController(
    IGuideRepository guideRepository,
    IGenericRepository<Guide> guideStore,
    IGenericRepository<CertificateHistory> certHistoryRepo,
    IUserRepository userRepo,
    GuideFactory guideFactory) : ControllerBase
{
    // HU-10 CA-01/02: listado real de guías con días hasta vencimiento
    [HttpGet("guides")]
    public async Task<ActionResult<IEnumerable<GuideResponseDTO>>> GetGuides()
    {
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var guides = await guideRepository.GetByAgencyAsync(agencyId);
        return Ok(guides.Select(g => new GuideResponseDTO(
            g.Id, g.FullName, g.Email, g.DocumentNumber, g.CertificateNumber,
            g.CertificateExpiryDate, g.Status.ToString(),
            (int)(g.CertificateExpiryDate - DateTime.UtcNow).TotalDays)));
    }

    // HU-04 CA-01/02: registrar guía vía GuideFactory (patrón Factory)
    [HttpPost("guides")]
    public async Task<ActionResult> CreateGuide([FromBody] RegisterGuideRequestDTO dto)
    {
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");

        // HU-04 CA-02: certificado duplicado
        if (await userRepo.ExistsGuideCertificateAsync(dto.CertificateNumber))
            throw new InvalidOperationException("Ya existe un guía con ese número de certificado.");

        // Email único
        if (await userRepo.GetByEmailAsync(dto.Email) is not null)
            throw new InvalidOperationException("El correo ya está registrado.");

        var guide = (Guide)guideFactory.Create(new(
            dto.Email, dto.Password, UserRole.Guide, dto.FullName,
            null, dto.CertificateExpiryDate, dto.CertificateNumber, agencyId));

        guide.DocumentNumber = dto.DocumentNumber;
        await guideStore.CreateAsync(guide);
        return Ok(new { guide.Id, message = "Guía registrado correctamente." });
    }

    // HU-12 CA-01/02: actualizar certificado archivando el historial
    [HttpPut("guides/{id:int}/certificate")]
    public async Task<ActionResult> UpdateCertificate(int id, [FromBody] UpdateCertificateRequestDTO dto)
    {
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var guide = await guideRepository.GetByIdWithUnavailabilityAsync(id)
            ?? throw new KeyNotFoundException("Guía no encontrado.");

        if (guide.AgencyId != agencyId)
            throw new UnauthorizedAccessException("El guía no pertenece a tu agencia.");

        // CERT-01/02: fecha debe ser futura
        if (dto.NewExpiryDate <= DateTime.UtcNow)
            throw new ArgumentException("La fecha de vencimiento debe ser futura.");

        // Archivar certificado anterior en historial
        await certHistoryRepo.CreateAsync(new CertificateHistory
        {
            GuideId = guide.Id,
            CertificateNumber = guide.CertificateNumber,
            CertificateExpiryDate = guide.CertificateExpiryDate,
            ArchivedAt = DateTime.UtcNow,
        });

        guide.CertificateNumber = dto.NewCertificateNumber;
        guide.CertificateExpiryDate = dto.NewExpiryDate;
        guide.Status = UserStatus.Active;
        await guideStore.UpdateAsync(guide);
        return NoContent();
    }
}
