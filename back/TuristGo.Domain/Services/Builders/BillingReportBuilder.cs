using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Builders;

public class BillingReportBuilder : IBillingReportBuilder
{
    private string _header = string.Empty;
    private readonly List<string> _lines = [];
    private decimal _amount;
    private decimal _retention;

    public IBillingReportBuilder AddHeader(string header) { _header = header; return this; }
    public IBillingReportBuilder AddInvoiceLines(IEnumerable<string> lines) { _lines.AddRange(lines); return this; }
    public IBillingReportBuilder AddTotals(decimal amount) { _amount = amount; return this; }
    public IBillingReportBuilder AddRetention(decimal retention) { _retention = retention; return this; }
    public BillingReport Build(DateOnly start, DateOnly end) => new(_header, _lines, _amount, _retention, start, end);
}
