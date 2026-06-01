namespace TuristGo.API.DTOs;

public record RegisterTouristRequestDTO(string Email, string Password, string FullName, string? Phone);
