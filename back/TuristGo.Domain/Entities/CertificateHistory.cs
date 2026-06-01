namespace TuristGo.Domain.Entities;

public class CertificateHistory : AuditBase
{
    public int GuideId { get; set; }
    public Guide? Guide { get; set; }
    public string CertificateNumber { get; set; } = string.Empty;
    public DateTime CertificateExpiryDate { get; set; }
    public string? CertificateFileUrl { get; set; }
    public DateTime ArchivedAt { get; set; } = DateTime.UtcNow;
}
