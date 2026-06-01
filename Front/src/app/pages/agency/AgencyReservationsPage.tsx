import { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import { toast } from 'sonner';
import { Sidebar } from '../../components/Sidebar';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { type ApiReservation, getAgencyReservationsApi, completeReservationApi } from '../../lib/api/services/reservationService';

const statusMap: Record<string, string> = {
  Confirmed: 'Confirmada', Completed: 'Completada', Cancelled: 'Cancelada',
};

export function AgencyReservationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [reservations, setReservations] = useState<ApiReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Todas');

  if (!isAuthenticated || user?.role !== 'Agencia') {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    getAgencyReservationsApi()
      .then(setReservations)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error al cargar reservas'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uiStatus = (s: string) => statusMap[s] ?? s;

  const handleMarkAsCompleted = async (res: ApiReservation) => {
    try {
      await completeReservationApi(res.id);
      setReservations(prev => prev.map(r =>
        r.id === res.id ? { ...r, status: 'Completed' } : r
      ));
      toast.success('Reserva marcada como completada. El turista puede calificar el tour.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al completar reserva');
    }
  };

  const filteredReservations = filterStatus === 'Todas'
    ? reservations
    : reservations.filter(r => uiStatus(r.status) === filterStatus);

  const statusFilters = ['Todas', 'Confirmada', 'Completada', 'Cancelada'];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="agency" />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>
          Gestión de Reservas
        </h1>

        <div className="mb-6 flex gap-2 flex-wrap">
          {statusFilters.map(status => (
            <Button key={status} size="sm" variant={filterStatus === status ? 'default' : 'outline'}
              onClick={() => setFilterStatus(status)}>
              {status}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando reservas...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Reserva</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredReservations.map((res) => (
                  <tr key={res.id}>
                    <td className="px-6 py-4 text-sm">{res.reservationNumber}</td>
                    <td className="px-6 py-4">{res.tourName}</td>
                    <td className="px-6 py-4">{new Date(res.tourDate).toLocaleDateString('es-CO')}</td>
                    <td className="px-6 py-4"><StatusBadge status={uiStatus(res.status) as any} /></td>
                    <td className="px-6 py-4">
                      {uiStatus(res.status) === 'Confirmada' && new Date(res.tourDate) < new Date() && (
                        <Button size="sm" onClick={() => handleMarkAsCompleted(res)}>
                          Marcar como completada
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
    </div>
  );
}