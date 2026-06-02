import { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import { toast } from 'sonner';
import { Sidebar } from '../../components/Sidebar';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { type ApiInvoiceAgency, getAgencyInvoicesApi } from '../../lib/api/services/invoiceService';

export function AgencyInvoicesPage() {
  const { user, isAuthenticated } = useAuth();
  const [invoices, setInvoices] = useState<ApiInvoiceAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('Todas');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  if (!isAuthenticated || user?.role !== 'Agencia') return <Navigate to="/login" replace />;

  const load = (start?: string, end?: string) => {
    setLoading(true);
    getAgencyInvoicesApi(start, end)
      .then(setInvoices)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error al cargar facturas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = () => load(filterDateFrom || undefined, filterDateTo || undefined);

  const shown = filterStatus === 'Todas'
    ? invoices
    : invoices.filter(i => i.status === filterStatus);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="agency" />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>Facturación</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-semibold mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Todas">Todas</option>
                <option value="Emitida">Emitida</option>
                <option value="Anulada">Anulada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleApplyFilters} className="w-full">Aplicar filtros</Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando facturas...</div>
        ) : shown.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">No hay facturas en este rango.</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Factura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bruto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retención</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Neto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr></thead>
              <tbody className="divide-y">
                {shown.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-6 py-4 text-sm">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">{inv.tourName}</td>
                    <td className="px-6 py-4">{new Date(inv.issuedAt).toLocaleDateString('es-CO')}</td>
                    <td className="px-6 py-4">${inv.amount.toLocaleString('es-CO')}</td>
                    <td className="px-6 py-4 text-orange-600">-${inv.retentionAmount.toLocaleString('es-CO')}</td>
                    <td className="px-6 py-4 font-semibold text-green-700">${inv.netAmount.toLocaleString('es-CO')}</td>
                    <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
