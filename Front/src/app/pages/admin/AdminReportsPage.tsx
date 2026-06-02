import { Navigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../lib/auth';
import { getAdminInvoiceItemsApi } from '../../lib/api/services/adminInvoiceService';
import type { AdminInvoiceItemUI } from '../../lib/api/services/adminInvoiceService';
import { getAdminBillingReportApi, type ApiAdminBillingReport } from '../../lib/api/services/invoiceService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DollarSign, FileText, CheckCircle } from 'lucide-react';

export function AdminReportsPage() {
  const { user, isAuthenticated } = useAuth();
  const [invoices, setInvoices] = useState<AdminInvoiceItemUI[]>([]);
  const [report, setReport] = useState<ApiAdminBillingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [periodStart, setPeriodStart] = useState('2026-01-01');
  const [periodEnd, setPeriodEnd] = useState('2026-12-31');

  if (!isAuthenticated || user?.role !== 'Administrador') {
    return <Navigate to="/login" replace />;
  }

  const load = async (start: string, end: string) => {
    try {
      setLoading(true);
      const [items, billingReport] = await Promise.all([
        getAdminInvoiceItemsApi(),
        getAdminBillingReportApi(start, end),
      ]);
      setInvoices(items);
      setReport(billingReport);
    } catch {
      setInvoices([]);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(periodStart, periodEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="admin" />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>Reportes</h1>

        {/* Selector de período HU-50 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-semibold mb-4">Período de análisis</h3>
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <Button onClick={() => load(periodStart, periodEnd)}>Aplicar</Button>
          </div>
        </div>

        {/* KPIs — HU-50 CA-01: emitidas/anuladas separadas, completadas, neto con retención */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Netos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '—' : `$${(report?.totalNet ?? 0).toLocaleString('es-CO')}`}
              </div>
              {report && <p className="text-xs text-gray-500 mt-1">Retención: ${report.totalRetention.toLocaleString('es-CO')}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emitidas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : (report?.totalIssued ?? 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anuladas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{loading ? '—' : (report?.totalVoided ?? 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? '—' : (report?.totalCompletedReservations ?? 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Desglose por Agencia con retención (Builder + RN-21) */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Desglose por Agencia (período seleccionado)</h2>
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emitidas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Anuladas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bruto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retención</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td className="px-6 py-6 text-gray-600" colSpan={6}>Cargando...</td></tr>
              ) : (report?.byAgency ?? []).length === 0 ? (
                <tr><td className="px-6 py-6 text-gray-600" colSpan={6}>Sin datos para este período</td></tr>
              ) : (report?.byAgency ?? []).map((ag) => (
                <tr key={ag.agencyId}>
                  <td className="px-6 py-4 font-medium">{ag.agencyName}</td>
                  <td className="px-6 py-4">{ag.issued}</td>
                  <td className="px-6 py-4 text-red-600">{ag.voided}</td>
                  <td className="px-6 py-4">${ag.gross.toLocaleString('es-CO')}</td>
                  <td className="px-6 py-4 text-orange-600">-${ag.retention.toLocaleString('es-CO')}</td>
                  <td className="px-6 py-4 font-semibold text-green-700">${ag.net.toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Historial completo */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Historial completo de facturas</h2>
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N°</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td className="px-6 py-6 text-gray-600" colSpan={6}>Cargando...</td></tr>
              ) : invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4">{invoice.id}</td>
                  <td className="px-6 py-4">{invoice.tourName}</td>
                  <td className="px-6 py-4">{invoice.agencyName}</td>
                  <td className="px-6 py-4">{new Date(invoice.createdAt).toLocaleDateString('es-CO')}</td>
                  <td className="px-6 py-4">${invoice.amount.toLocaleString('es-CO')}</td>
                  <td className="px-6 py-4"><StatusBadge status={invoice.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}