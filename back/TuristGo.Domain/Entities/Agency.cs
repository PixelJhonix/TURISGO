namespace TuristGo.Domain.Entities;

public sealed class Agency : User
{
    public string CommercialName { get; set; } = string.Empty;
    public string NIT { get; set; } = string.Empty;
    public string? CorporatePhone { get; set; }
    public string? Description { get; set; }
    public string? ConstitutionDocumentUrl { get; set; }
    public decimal CommissionPercentage { get; set; }
}
