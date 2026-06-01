using TuristGo.Domain.Entities;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Strategies;

public class AdminAuthStrategy : IAuthStrategy
{
    public Task<AuthResultDTO> AuthenticateAsync(LoginRequestModel credentials, User dbUser, Func<User, string> jwtFactory)
        => Task.FromResult(new AuthResultDTO(true, jwtFactory(dbUser), dbUser.Role.ToString(), "/admin/inicio", null, null));
}
