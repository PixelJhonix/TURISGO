using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Strategies;

public class AgencyAuthStrategy : IAuthStrategy
{
    public Task<AuthResultDTO> AuthenticateAsync(LoginRequestModel credentials, User dbUser, Func<User, string> jwtFactory)
    {
        if (dbUser.Status == UserStatus.Pending) return Task.FromResult(new AuthResultDTO(false, null, null, null, "Tu solicitud esta en revision", null));
        if (dbUser.Status == UserStatus.Suspended) return Task.FromResult(new AuthResultDTO(false, null, null, null, "Cuenta suspendida", null));
        return Task.FromResult(new AuthResultDTO(true, jwtFactory(dbUser), dbUser.Role.ToString(), "/agencia/inicio", null, null));
    }
}
