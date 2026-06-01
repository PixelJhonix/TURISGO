using TuristGo.Domain.Entities;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Strategies;

public class GuideAuthStrategy : IAuthStrategy
{
    public Task<AuthResultDTO> AuthenticateAsync(LoginRequestModel credentials, User dbUser, Func<User, string> jwtFactory)
    {
        var guide = dbUser as Guide;
        var alert = guide is not null && guide.CertificateExpiryDate <= DateTime.UtcNow ? "Certificado expirado" : null;
        return Task.FromResult(new AuthResultDTO(true, jwtFactory(dbUser), dbUser.Role.ToString(), "/guia/inicio", alert, null));
    }
}
