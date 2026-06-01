namespace TuristGo.API.DTOs;

public record ReservationRequestDTO(int TourId, string TourDate, int? TourScheduleId, string? StartTime, string? EndTime);
