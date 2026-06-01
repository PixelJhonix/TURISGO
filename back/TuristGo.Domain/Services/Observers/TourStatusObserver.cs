using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Observers;

public class TourStatusObserver(ITourRepository tourRepository) : IAgencyObserver
{
    public async Task OnAgencySuspendedAsync(int agencyId)
    {
        var tours = await tourRepository.GetByAgencyAsync(agencyId);
        foreach (var tour in tours)
        {
            tour.Status = TourStatus.Inactive;
            await tourRepository.UpdateAsync(tour);
        }
    }
}
