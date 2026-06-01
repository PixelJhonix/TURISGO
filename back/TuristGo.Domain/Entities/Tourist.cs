namespace TuristGo.Domain.Entities;

public sealed class Tourist : User
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? PhotoUrl { get; set; }
}
