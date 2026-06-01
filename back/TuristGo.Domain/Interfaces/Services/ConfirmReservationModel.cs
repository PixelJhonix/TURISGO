namespace TuristGo.Domain.Interfaces.Services;

public record ConfirmReservationModel(int TourId, DateOnly TourDate, int? TourScheduleId, TimeOnly? StartTime, TimeOnly? EndTime);
