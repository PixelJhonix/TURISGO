using TuristGo.Domain.Entities;

namespace TuristGo.Domain.Interfaces.Services;

public interface IUsuarioFactory
{
    User Create(RegisterRequestModel request);
}
