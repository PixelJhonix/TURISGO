using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Builders;

public class BillingReportDirector
{
    public BillingReport Build(IBillingReportBuilder builder, string header, IEnumerable<string> lines, decimal amount, decimal retention, DateOnly start, DateOnly end)
        => builder.AddHeader(header).AddInvoiceLines(lines).AddTotals(amount).AddRetention(retention).Build(start, end);
}
