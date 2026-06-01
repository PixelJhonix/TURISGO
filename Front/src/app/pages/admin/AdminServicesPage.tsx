import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { toast } from 'sonner';
import { Sidebar } from '../../components/Sidebar';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { Tour } from '../../lib/mockData';
import { getToursApi, setTourStatusApi } from '../../lib/api/services/tourService';

export function AdminServicesPage() {
  const { user, isAuthenticated } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [bajaTarget, setBajaTarget] = useState<string | null>(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [loading, setLoading] = useState(false);
  
  if (!isAuthenticated || user?.role !== 'Administrador') {
    return <Navigate to="/login" replace />;
  }

  const loadTours = async () => {
    try {
      setLoading(true);
      setTours(await getToursApi());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No fue posible cargar tours');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBaja = () => {
    if (!bajaTarget) return;
    const id = Number(bajaTarget);
    if (!Number.isFinite(id) || id <= 0) {
      toast.error('Id inválido');
      return;
    }

    setTourStatusApi(id, 'Inactivo')
      .then(async () => {
        toast.success('Servicio dado de baja.');
        setBajaTarget(null);
        setMotivoBaja('');
        await loadTours();
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'No fue posible dar de baja'));
  };

  const handleReactivar = (tourId: string) => {
    const id = Number(tourId);
    if (!Number.isFinite(id) || id <= 0) {
      toast.error('Id inválido');
      return;
    }
    setTourStatusApi(id, 'Activo')
      .then(async () => {
        toast.success('Servicio reactivado.');
        await loadTours();
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'No fue posible reactivar'));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="admin" />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>
          Gestión de Servicios
        </h1>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calificación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td className="px-6 py-6 text-gray-600" colSpan={5}>Cargando...</td>
                </tr>
              ) : (
              tours.map((tour) => (
                <tr key={tour.id}>
                  <td className="px-6 py-4">{tour.name}</td>
                  <td className="px-6 py-4 text-gray-500">—</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tour.status} />
                  </td>
                  <td className="px-6 py-4">⭐ {tour.rating}</td>
                  <td className="px-6 py-4">
                    {tour.status === 'Activo' ? (
                      <Button size="sm" variant="destructive" onClick={() => setBajaTarget(tour.id)}>
                        Dar de baja
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleReactivar(tour.id)}>
                        Reactivar
                      </Button>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Baja Dialog */}
      {bajaTarget && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Dar de baja servicio</h2>
              <p className="text-sm text-gray-600 mt-1">
                {tours.find(t => t.id === bajaTarget)?.name}
              </p>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la baja
              </label>
              <textarea
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--turistgo-primary)]"
                placeholder="Describe el motivo..."
              />
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setBajaTarget(null);
                  setMotivoBaja('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBaja}
              >
                Confirmar baja
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}