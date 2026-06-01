namespace TuristGo.Domain.Interfaces.Services;

public interface IBillingReportBuilder
{
    IBillingReportBuilder AddHeader(string header);
    IBillingReportBuilder AddInvoiceLines(IEnumerable<string> lines);
    IBillingReportBuilder AddTotals(decimal amount);
    IBillingReportBuilder AddRetention(decimal retention);
    BillingReport Build(DateOnly start, DateOnly end);
}
