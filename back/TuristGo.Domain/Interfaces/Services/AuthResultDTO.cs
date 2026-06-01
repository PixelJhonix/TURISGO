namespace TuristGo.Domain.Interfaces.Services;

public record AuthResultDTO(bool Success, string? Token, string? Role, string? RedirectUrl, string? AlertMessage, string? ErrorMessage);
