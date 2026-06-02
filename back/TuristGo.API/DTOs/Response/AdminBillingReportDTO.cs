namespace TuristGo.API.DTOs;

public record AdminBillingAgencyRow(int AgencyId, string AgencyName, int Issued, int Voided, decimal Gross, decimal Retention, decimal Net);

public record AdminBillingReportDTO(
    string PeriodStart,
    string PeriodEnd,
    decimal TotalGross,
    decimal TotalRetention,
    decimal TotalNet,
    int TotalIssued,
    int TotalVoided,
    int TotalCompletedReservations,
    IEnumerable<AdminBillingAgencyRow> ByAgency
);
