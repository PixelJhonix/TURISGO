using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuristGo.API.DTOs;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Interfaces.Repositories;

namespace TuristGo.API.Controllers;

[ApiController]
[Authorize]
[Route("api/invoice")]
public class InvoiceController(IGenericRepository<Invoice> invoiceRepository, IInvoiceRepository invoiceDetailsRepository) : ControllerBase
{
    [HttpGet] public async Task<ActionResult> GetAll() => Ok(await invoiceRepository.GetAllAsync());

    [Authorize(Roles = "Admin")]
    [HttpGet("admin/items")]
    public async Task<ActionResult<IEnumerable<AdminInvoiceItemDTO>>> GetAdminItems()
    {
        var invoices = await invoiceDetailsRepository.GetAllWithDetailsAsync();
        var result = invoices
            .Where(i => i.Reservation is not null && i.Reservation.Tour is not null && i.Reservation.Tour.Agency is not null)
            .Select(i => new AdminInvoiceItemDTO(
                i.Id,
                i.Amount,
                (int)i.Status,
                i.CreatedAt,
                i.ReservationId,
                i.Reservation!.TourId,
                i.Reservation.Tour!.Name,
                i.Reservation.Tour.AgencyId,
                i.Reservation.Tour.Agency!.CommercialName))
            .ToList();

        return Ok(result);
    }
}
