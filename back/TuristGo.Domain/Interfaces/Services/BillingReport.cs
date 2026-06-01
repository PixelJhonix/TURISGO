namespace TuristGo.Domain.Interfaces.Services;

public record BillingReport(string Header, List<string> InvoiceLines, decimal TotalAmount, decimal TotalRetention, DateOnly PeriodStart, DateOnly PeriodEnd);
