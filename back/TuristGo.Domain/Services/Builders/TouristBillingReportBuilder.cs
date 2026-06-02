using TuristGo.Domain.Interfaces.Services;

namespace TuristGo.Domain.Services.Builders;

// PUML: ReporteTuristaBuilder — genera reporte de facturas para turista (sin retención)
public class TouristBillingReportBuilder : IBillingReportBuilder
{
    private string _header = string.Empty;
    private readonly List<string> _lines = [];
    private decimal _amount;

    public IBillingReportBuilder AddHeader(string header) { _header = header; return this; }
    public IBillingReportBuilder AddInvoiceLines(IEnumerable<string> lines) { _lines.AddRange(lines); return this; }
    public IBillingReportBuilder AddTotals(decimal amount) { _amount = amount; return this; }
    public IBillingReportBuilder AddRetention(decimal retention) => this; // turista no tiene retención
    public BillingReport Build(DateOnly start, DateOnly end) => new(_header, _lines, _amount, 0m, start, end);
}
