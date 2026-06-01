using TuristGo.Domain.Entities;

namespace TuristGo.Domain.Interfaces.Services;

public interface IAuthStrategy
{
    Task<AuthResultDTO> AuthenticateAsync(LoginRequestModel credentials, User dbUser, Func<User, string> jwtFactory);
}
