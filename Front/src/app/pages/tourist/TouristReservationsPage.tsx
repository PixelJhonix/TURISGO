import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router';
import { Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { type ApiReservation, getMyReservationsApi, cancelReservationApi } from '../../lib/api/services/reservationService';
import { apiClient } from '../../lib/api/client';

const statusMap: Record<string, string> = {
  Confirmed: 'Confirmada', Completed: 'Completada', Cancelled: 'Cancelada',
};

export function TouristReservationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<string>('Todas');
  const [reservations, setReservations] = useState<ApiReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [rateTarget, setRateTarget] = useState<number | null>(null);
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState('');

  if (!isAuthenticated || user?.role !== 'Turista') {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    getMyReservationsApi()
      .then(setReservations)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error al cargar reservas'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uiStatus = (s: string) => statusMap[s] ?? s;

  const filteredReservations = filter === 'Todas'
    ? reservations
    : reservations.filter((r) => uiStatus(r.status) === filter);

  const filters = ['Todas', 'Confirmada', 'Completada', 'Cancelada'];

  const handleCancelReservation = async () => {
    if (!cancelTarget) return;
    try {
      await cancelReservationApi(cancelTarget);
      setReservations(prev => prev.map(r =>
        r.id === cancelTarget ? { ...r, status: 'Cancelled' } : r
      ));
      toast.success('Reserva cancelada. La factura ha sido anulada.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cancelar');
    } finally {
      setCancelTarget(null);
    }
  };


  const handleRateTour = async () => {
    if (stars === 0) { toast.error('Selecciona una calificación'); return; }
    if (!rateTarget) return;
    try {
      await apiClient.post(`/reservation/${rateTarget}/review`, { rating: stars, comment: review || undefined });
      toast.success('¡Gracias por tu calificación!');
      setRateTarget(null);
      setStars(0);
      setReview('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al enviar calificación');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="tourist" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>
          Mis Reservas
        </h1>

        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((f) => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
              {f}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando reservas...</div>
        ) : filteredReservations.length > 0 ? (
          <div className="space-y-4">
            {filteredReservations.map((reservation) => (
              <div key={reservation.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold">{reservation.tourName}</h3>
                      {reservation.agencyName && (
                        <p className="text-sm text-primary font-medium">{reservation.agencyName}</p>
                      )}
                      <p className="text-gray-600">{reservation.reservationNumber}</p>
                    </div>
                    <StatusBadge status={uiStatus(reservation.status) as any} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-700">
                    <div>
                      <p className="font-semibold">Fecha</p>
                      <p>{new Date(reservation.tourDate).toLocaleDateString('es-CO')}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Total</p>
                      <p>${reservation.amount.toLocaleString('es-CO')}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Link to={`/turista/reservas/${reservation.id}`}>
                      <Button size="sm">Ver detalles</Button>
                    </Link>
                    {uiStatus(reservation.status) === 'Completada' && (
                      <Button size="sm" variant="outline" onClick={() => setRateTarget(reservation.id)}>
                        Calificar tour
                      </Button>
                    )}
                    {uiStatus(reservation.status) === 'Confirmada' && (
                      <Button size="sm" variant="destructive" onClick={() => setCancelTarget(reservation.id)}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg mb-4">
              {filter === 'Todas'
                ? 'Aún no tienes reservas. ¡Explora el catálogo para encontrar tu próximo tour!'
                : `No tienes reservas con estado "${filter}"`}
            </p>
            <Link to="/turista/tours"><Button>Explorar tours</Button></Link>
          </div>
        )}
      </div>

      {cancelTarget !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">¿Cancelar reserva?</h2>
            <p className="text-gray-600 mb-6">Solo puedes cancelar con más de 24 horas de anticipación al tour.</p>
            <div className="flex justify-end gap-3">
              <Button size="sm" variant="outline" onClick={() => setCancelTarget(null)}>Volver</Button>
              <Button size="sm" variant="destructive" onClick={handleCancelReservation}>Confirmar cancelación</Button>
            </div>
          </div>
        </div>
      )}

      {rateTarget !== null && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Calificar tour</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Comparte tu experiencia con otros viajeros
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRateTarget(null);
                    setStars(0);
                    setReview('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Calificación
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 cursor-pointer transition-colors ${
                        stars >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                      onClick={() => setStars(star)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reseña (opcional)
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Cuéntanos sobre tu experiencia..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--turistgo-primary)] focus:border-transparent"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRateTarget(null);
                  setStars(0);
                  setReview('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleRateTour}>
                Enviar calificación
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}