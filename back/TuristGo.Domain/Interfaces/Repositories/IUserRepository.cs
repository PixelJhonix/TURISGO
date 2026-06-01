using TuristGo.Domain.Entities;

namespace TuristGo.Domain.Interfaces.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<bool> ExistsGuideCertificateAsync(string certificateNumber);
    Task<IEnumerable<User>> GetAllUsersAsync();
}
