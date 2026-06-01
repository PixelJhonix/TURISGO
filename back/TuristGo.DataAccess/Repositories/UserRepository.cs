using Microsoft.EntityFrameworkCore;
using TuristGo.DataAccess.Context;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Interfaces.Repositories;

namespace TuristGo.DataAccess.Repositories;

public class UserRepository(TuristGoDbContext context) : IUserRepository
{
    public async Task<User?> GetByEmailAsync(string email) => await context.Users.FirstOrDefaultAsync(x => x.Email == email);
    public async Task<bool> ExistsGuideCertificateAsync(string certificateNumber) => await context.Guides.AnyAsync(x => x.CertificateNumber == certificateNumber);
    public async Task<IEnumerable<User>> GetAllUsersAsync() => await context.Users.ToListAsync();
}
