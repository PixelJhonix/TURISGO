using TuristGo.Domain.Enums;

namespace TuristGo.Domain.Interfaces.Services;

public record ReservationEventDTO(int ReservationId, ReservationStatus NewStatus, int TourId, int TouristId);
