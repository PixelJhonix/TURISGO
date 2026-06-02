import { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import { toast } from 'sonner';
import { Sidebar } from '../../components/Sidebar';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { type ApiInvoiceAgency, getAgencyInvoicesApi, createManualInvoiceApi } from '../../lib/api/services/invoiceService';

export function AgencyInvoicesPage() {
  const { user, isAuthenticated } = useAuth();
  const [invoices, setInvoices] = useState<ApiInvoiceAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('Todas');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({ reservationId: '', amount: '', description: '' });
  const [savingManual, setSavingManual] = useState(false);

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Playfair Display' }}>Facturación</h1>
          <Button onClick={() => setShowManualModal(true)}>+ Emitir factura manual</Button>
        </div>

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
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
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${inv.isManual ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                        {inv.isManual ? 'Manual' : 'Automática'}
                      </span>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showManualModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b">
              <h2 className="text-xl font-semibold">Emitir factura manual</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID de reserva</label>
                <input type="number" value={manualForm.reservationId}
                  onChange={(e) => setManualForm({ ...manualForm, reservationId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: 5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto (COP)</label>
                <input type="number" value={manualForm.amount}
                  onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: 50000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del ajuste</label>
                <textarea value={manualForm.description} rows={3}
                  onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: Cargo adicional por equipamiento especial" />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowManualModal(false); setManualForm({ reservationId: '', amount: '', description: '' }); }}>Cancelar</Button>
              <Button disabled={savingManual} onClick={async () => {
                if (!manualForm.reservationId || !manualForm.amount || !manualForm.description.trim()) {
                  toast.error('Completa todos los campos'); return;
                }
                try {
                  setSavingManual(true);
                  await createManualInvoiceApi(Number(manualForm.reservationId), Number(manualForm.amount), manualForm.description.trim());
                  toast.success('Factura manual emitida');
                  setShowManualModal(false);
                  setManualForm({ reservationId: '', amount: '', description: '' });
                  load();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Error al emitir factura');
                } finally {
                  setSavingManual(false);
                }
              }}>
                {savingManual ? 'Emitiendo...' : 'Emitir factura'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
