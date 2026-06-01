namespace TuristGo.Domain.Entities;

public sealed class Guide : User
{
    public string FullName { get; set; } = string.Empty;
    public string DocumentNumber { get; set; } = string.Empty;
    public string CertificateNumber { get; set; } = string.Empty;
    public DateTime CertificateExpiryDate { get; set; }
    public string? CertificateFileUrl { get; set; }
    public int AgencyId { get; set; }
    public Agency? Agency { get; set; }
}
