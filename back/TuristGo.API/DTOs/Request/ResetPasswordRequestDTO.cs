namespace TuristGo.API.DTOs;

public record ResetPasswordRequestDTO(string Token, string NewPassword);
