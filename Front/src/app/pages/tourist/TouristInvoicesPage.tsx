import { Navigate, Link } from 'react-router';
import { useState, useEffect } from 'react';
import { Download, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { type ApiInvoiceTourist, getMyInvoicesApi } from '../../lib/api/services/invoiceService';

export function TouristInvoicesPage() {
  const { user, isAuthenticated } = useAuth();
  const [invoices, setInvoices] = useState<ApiInvoiceTourist[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState<ApiInvoiceTourist | null>(null);

  if (!isAuthenticated || user?.role !== 'Turista') return <Navigate to="/login" replace />;

  useEffect(() => {
    getMyInvoicesApi()
      .then(setInvoices)
      .catch(() => toast.error('Error al cargar facturas'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="tourist" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>Mis Facturas</h1>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando facturas...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg mb-4">Aún no tienes facturas. Realiza tu primera reserva.</p>
            <Link to="/turista/tours"><Button>Explorar tours</Button></Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Factura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-6 py-4 text-sm font-medium">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{inv.tourName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(inv.issuedAt).toLocaleDateString('es-CO')}</td>
                    <td className="px-6 py-4 text-sm font-semibold">${inv.amount.toLocaleString('es-CO')}</td>
                    <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                    <td className="px-6 py-4">
                      {inv.status === 'Emitida' && (
                        <Button size="sm" variant="outline" onClick={() => setPreviewInvoice(inv)}>
                          <FileText className="h-4 w-4 mr-2" />Ver factura
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewInvoice && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="px-6 py-5 border-b flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{previewInvoice.invoiceNumber}</h2>
                  <p className="text-sm text-gray-600">{previewInvoice.tourName}</p>
                </div>
              </div>
              <button onClick={() => setPreviewInvoice(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-8 bg-gray-50">
              <div id="invoice-print-area" className="bg-white p-8 rounded-lg border border-gray-200">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#1A6B4A' }}>
                    <span className="text-white font-bold text-2xl">T</span>
                  </div>
                  <h1 className="text-3xl font-bold" style={{ color: '#1A6B4A' }}>TuristGo</h1>
                  <p className="text-sm text-gray-600 mt-2">Factura Electrónica</p>
                </div>
                <div className="grid grid-cols-2 gap-4 border-y py-6 mb-6">
                  <div><p className="text-sm text-gray-600">N° Factura</p><p className="font-semibold">{previewInvoice.invoiceNumber}</p></div>
                  <div><p className="text-sm text-gray-600">Fecha</p><p className="font-semibold">{new Date(previewInvoice.issuedAt).toLocaleDateString('es-CO')}</p></div>
                  <div><p className="text-sm text-gray-600">Estado</p><p className="font-semibold text-green-600">Emitida</p></div>
                  <div><p className="text-sm text-gray-600">Cliente</p><p className="font-semibold">{user?.name}</p></div>
                </div>
                <table className="w-full mb-6">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Servicio</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Valor</th>
                  </tr></thead>
                  <tbody><tr className="border-t">
                    <td className="px-4 py-3">{previewInvoice.tourName}</td>
                    <td className="px-4 py-3 text-right font-semibold">${previewInvoice.amount.toLocaleString('es-CO')}</td>
                  </tr></tbody>
                </table>
                <div className="border-t pt-4 flex justify-between items-center">
                  <p className="text-lg font-semibold">Total</p>
                  <p className="text-2xl font-bold" style={{ color: '#1A6B4A' }}>${previewInvoice.amount.toLocaleString('es-CO')} COP</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPreviewInvoice(null)}>Cerrar</Button>
              <Button onClick={() => window.print()}>
                <Download className="h-4 w-4 mr-2" />Descargar PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
