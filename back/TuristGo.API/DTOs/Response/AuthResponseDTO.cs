namespace TuristGo.API.DTOs;

public record AuthResponseDTO(bool Success, string? Token, string? Role, string? RedirectUrl, string? AlertMessage, string? ErrorMessage);
