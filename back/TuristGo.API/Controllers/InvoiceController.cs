using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuristGo.API.DTOs;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Services.Builders;

namespace TuristGo.API.Controllers;

[ApiController]
[Authorize]
[Route("api/invoice")]
public class InvoiceController(
    IInvoiceRepository invoiceRepo,
    BillingReportDirector director) : ControllerBase
{
    // HU-48 CA-01/02: facturas del turista con nombre del tour
    [HttpGet("my")]
    [Authorize(Roles = "Tourist")]
    public async Task<ActionResult<IEnumerable<InvoiceTouristResponseDTO>>> GetMyInvoices()
    {
        var touristId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var invoices = await invoiceRepo.GetByTouristAsync(touristId);
        return Ok(invoices.Select(i => new InvoiceTouristResponseDTO(
            i.Id,
            $"FAC-{i.CreatedAt:yyyy}-{i.Id:D6}",
            i.Reservation?.Tour?.Name ?? "Tour",
            i.CreatedAt,
            i.Amount,
            i.Status == InvoiceStatus.Active ? "Emitida" : "Anulada")));
    }

    // HU-49 CA-01-03: historial agencia con retención y filtro fechas
    [HttpGet("agency")]
    [Authorize(Roles = "Agency")]
    public async Task<ActionResult<IEnumerable<InvoiceAgencyResponseDTO>>> GetAgencyInvoices(
        [FromQuery] string? start, [FromQuery] string? end)
    {
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        DateOnly? startDate = start is null ? null : DateOnly.Parse(start);
        DateOnly? endDate = end is null ? null : DateOnly.Parse(end);
        var invoices = await invoiceRepo.GetByAgencyAsync(agencyId, startDate, endDate);
        return Ok(invoices.Select(i => {
            var commission = i.Reservation?.Tour?.Agency?.CommissionPercentage ?? 0m;
            var retention = i.Amount * commission / 100m;
            return new InvoiceAgencyResponseDTO(
                i.Id, $"FAC-{i.CreatedAt:yyyy}-{i.Id:D6}",
                i.Reservation?.Tour?.Name ?? "Tour", i.CreatedAt,
                i.Amount, retention, i.Amount - retention,
                i.Status == InvoiceStatus.Active ? "Emitida" : "Anulada", false);
        }));
    }

    // HU-47: factura manual emitida por la agencia
    [HttpPost("agency/manual")]
    [Authorize(Roles = "Agency")]
    public async Task<ActionResult> CreateManual([FromBody] ManualInvoiceRequestDTO dto)
    {
        var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        if (string.IsNullOrWhiteSpace(dto.Description))
            throw new ArgumentException("La descripción es obligatoria para facturas manuales.");
        if (dto.Amount <= 0)
            throw new ArgumentException("El monto debe ser mayor a cero.");
        var invoice = await invoiceRepo.CreateManualAsync(agencyId, dto.ReservationId, dto.Amount, dto.Description);
        return Ok(new { invoice.Id, message = "Factura manual emitida." });
    }

    // HU-50 + Builder pattern: reporte admin con período, retenciones, anuladas separadas
    [HttpGet("admin/report")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AdminBillingReportDTO>> GetAdminReport(
        [FromQuery] string start = "2026-01-01", [FromQuery] string end = "2026-12-31")
    {
        var startDate = DateOnly.Parse(start);
        var endDate = DateOnly.Parse(end);
        var invoices = await invoiceRepo.GetAllWithDetailsAsync();
        var inPeriod = invoices.Where(i =>
            DateOnly.FromDateTime(i.CreatedAt) >= startDate &&
            DateOnly.FromDateTime(i.CreatedAt) <= endDate).ToList();
        var completedCount = await invoiceRepo.CountCompletedReservationsByPeriodAsync(startDate, endDate);

        var byAgency = inPeriod
            .Where(i => i.Reservation?.Tour?.Agency is not null)
            .GroupBy(i => i.Reservation!.Tour!.AgencyId)
            .Select(g => {
                var commission = g.First().Reservation!.Tour!.Agency!.CommissionPercentage;
                var issued = g.Where(i => i.Status == InvoiceStatus.Active).ToList();
                var voided = g.Count(i => i.Status == InvoiceStatus.Voided);
                var gross = issued.Sum(i => i.Amount);
                var retention = gross * commission / 100m;
                return new AdminBillingAgencyRow(g.Key,
                    g.First().Reservation!.Tour!.Agency!.CommercialName,
                    issued.Count, voided, gross, retention, gross - retention);
            }).ToList();

        var builder = new AdminBillingReportBuilder();
        var lines = inPeriod.Select(i => $"{i.Id}: {i.Reservation?.Tour?.Name} — ${i.Amount:N0}");
        var totalGross = byAgency.Sum(a => a.Gross);
        var totalRetention = byAgency.Sum(a => a.Retention);
        director.Build(builder, $"Reporte Admin {start} - {end}", lines, totalGross, totalRetention, startDate, endDate);

        return Ok(new AdminBillingReportDTO(start, end,
            totalGross, totalRetention, totalGross - totalRetention,
            inPeriod.Count(i => i.Status == InvoiceStatus.Active),
            inPeriod.Count(i => i.Status == InvoiceStatus.Voided),
            completedCount, byAgency));
    }

    // Endpoint legado para AdminReportsPage
    [Authorize(Roles = "Admin")]
    [HttpGet("admin/items")]
    public async Task<ActionResult<IEnumerable<AdminInvoiceItemDTO>>> GetAdminItems()
    {
        var invoices = await invoiceRepo.GetAllWithDetailsAsync();
        return Ok(invoices
            .Where(i => i.Reservation?.Tour?.Agency is not null)
            .Select(i => new AdminInvoiceItemDTO(
                i.Id, i.Amount, (int)i.Status, i.CreatedAt,
                i.ReservationId, i.Reservation!.TourId,
                i.Reservation.Tour!.Name,
                i.Reservation.Tour.AgencyId,
                i.Reservation.Tour.Agency!.CommercialName)));
    }
}
