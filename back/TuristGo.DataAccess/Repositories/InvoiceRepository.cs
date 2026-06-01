using Microsoft.EntityFrameworkCore;
using TuristGo.DataAccess.Context;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Interfaces.Repositories;

namespace TuristGo.DataAccess.Repositories;

public class InvoiceRepository(TuristGoDbContext context) : GenericRepository<Invoice>(context), IInvoiceRepository
{
    public async Task<IEnumerable<Invoice>> GetAllWithDetailsAsync()
        => await context.Invoices
            .Include(i => i.Reservation)
            .ThenInclude(r => r!.Tour)
            .ThenInclude(t => t!.Agency)
            .ToListAsync();
}
