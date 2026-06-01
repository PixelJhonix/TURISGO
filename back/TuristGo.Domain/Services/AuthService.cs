using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services;

public class AuthService(
    IUserRepository userRepository,
    IGenericRepository<User> userStore,
    Dictionary<UserRole, IAuthStrategy> strategies,
    Func<User, string> jwtFactory)
{
    public async Task<AuthResultDTO> LoginAsync(LoginRequestModel request)
    {
        var user = await userRepository.GetByEmailAsync(request.Email);
        if (user is null) return new AuthResultDTO(false, null, null, null, null, "Credenciales invalidas");

        // HU-05 CA-03: comprobar bloqueo ANTES de validar contraseña
        if (user.LockoutUntil.HasValue && user.LockoutUntil > DateTime.UtcNow)
            return new AuthResultDTO(false, null, null, null, null, "Cuenta bloqueada temporalmente. Intenta de nuevo en 15 minutos.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            // HU-05 CA-03: 15 minutos según documento, no 30
            if (user.FailedLoginAttempts >= 5) user.LockoutUntil = DateTime.UtcNow.AddMinutes(15);
            await userStore.UpdateAsync(user);
            return new AuthResultDTO(false, null, null, null, null, "Credenciales invalidas");
        }

        user.FailedLoginAttempts = 0;
        user.LockoutUntil = null;
        await userStore.UpdateAsync(user);

        return await strategies[user.Role].AuthenticateAsync(request, user, jwtFactory);
    }
}
