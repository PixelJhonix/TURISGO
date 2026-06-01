using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Strategies;

public class TouristAuthStrategy : IAuthStrategy
{
    public Task<AuthResultDTO> AuthenticateAsync(LoginRequestModel credentials, User dbUser, Func<User, string> jwtFactory)
    {
        if (dbUser.Status != UserStatus.Active) return Task.FromResult(new AuthResultDTO(false, null, null, null, null, "Cuenta inactiva"));
        return Task.FromResult(new AuthResultDTO(true, jwtFactory(dbUser), dbUser.Role.ToString(), "/turista/inicio", null, null));
    }
}
