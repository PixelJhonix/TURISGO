import { Navigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { getAdminInvoiceItemsApi } from '../../lib/api/services/adminInvoiceService';
import type { AdminInvoiceItemUI } from '../../lib/api/services/adminInvoiceService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, DollarSign, FileText } from 'lucide-react';

export function AdminReportsPage() {
  const { user, isAuthenticated } = useAuth();
  const [invoices, setInvoices] = useState<AdminInvoiceItemUI[]>([]);
  const [loading, setLoading] = useState(false);
  
  if (!isAuthenticated || user?.role !== 'Administrador') {
    return <Navigate to="/login" replace />;
  }

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setInvoices(await getAdminInvoiceItemsApi());
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emitidas = invoices.filter((i) => i.status === 'Emitida');
  const anuladas = invoices.filter((i) => i.status === 'Anulada');
  const totalIngresos = emitidas.reduce((sum, i) => sum + i.amount, 0);

  const byAgency = invoices.reduce<Record<number, { agencyId: number; agencyName: string; ingresos: number; facturas: number }>>(
    (acc, inv) => {
      const key = inv.agencyId;
      const prev = acc[key] || { agencyId: inv.agencyId, agencyName: inv.agencyName, ingresos: 0, facturas: 0 };
      acc[key] = {
        ...prev,
        facturas: prev.facturas + 1,
        ingresos: prev.ingresos + (inv.status === 'Emitida' ? inv.amount : 0),
      };
      return acc;
    },
    {}
  );
  const agenciaData = Object.values(byAgency).sort((a, b) => b.ingresos - a.ingresos);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="admin" />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>
          Reportes
        </h1>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '—' : `$${totalIngresos.toLocaleString('es-CO')}`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas Emitidas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : emitidas.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas Anuladas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{loading ? '—' : anuladas.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : invoices.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Desglose por Agencia */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Desglose por Agencia</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agencia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facturas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingresos (Emitidas)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td className="px-6 py-6 text-gray-600" colSpan={3}>Cargando...</td>
                  </tr>
                ) : agenciaData.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-gray-600" colSpan={3}>Sin datos</td>
                  </tr>
                ) : (
                  agenciaData.map((ag) => (
                    <tr key={ag.agencyId}>
                      <td className="px-6 py-4">{ag.agencyName}</td>
                      <td className="px-6 py-4">{ag.facturas}</td>
                      <td className="px-6 py-4">${ag.ingresos.toLocaleString('es-CO')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Facturas Recientes */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Facturas Recientes (MVP)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Factura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td className="px-6 py-6 text-gray-600" colSpan={4}>Cargando...</td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4">{invoice.id}</td>
                      <td className="px-6 py-4">{new Date(invoice.createdAt).toLocaleString('es-CO')}</td>
                      <td className="px-6 py-4">${invoice.amount.toLocaleString('es-CO')}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={invoice.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}