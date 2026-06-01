namespace TuristGo.Domain.Interfaces.Services;

public interface IAgencyObserver
{
    Task OnAgencySuspendedAsync(int agencyId);
}
