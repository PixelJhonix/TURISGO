namespace TuristGo.API.DTOs;

public record AdminUserResponseDTO(int Id, string Name, string Email, string Role, string Status, decimal? CommissionPercentage);
