using TuristGo.Domain.Entities;

namespace TuristGo.Domain.Interfaces.Repositories;

public interface IInvoiceRepository : IGenericRepository<Invoice>
{
    Task<IEnumerable<Invoice>> GetAllWithDetailsAsync();
}
