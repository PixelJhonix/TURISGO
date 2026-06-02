namespace TuristGo.API.DTOs;

public record ForgotPasswordResponseDTO(string ResetToken, string ExpiresAt, string Message);
