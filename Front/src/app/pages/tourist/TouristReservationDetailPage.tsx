import { useParams, Navigate, Link, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { MapPin, Calendar, DollarSign, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { getMyReservationsApi, cancelReservationApi, type ApiReservation } from '../../lib/api/services/reservationService';
import { apiClient } from '../../lib/api/client';

const statusUi: Record<string, string> = {
  Confirmed: 'Confirmada', Completed: 'Completada', Cancelled: 'Cancelada',
};

export function TouristReservationDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<ApiReservation | null | undefined>(undefined);
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState('');
  const [showRateModal, setShowRateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated || user?.role !== 'Turista') return <Navigate to="/login" replace />;

  useEffect(() => {
    getMyReservationsApi()
      .then((list) => {
        const found = list.find((r) => String(r.id) === id);
        setReservation(found ?? null);
      })
      .catch(() => setReservation(null));
  }, [id]);

  // Cargando
  if (reservation === undefined) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar variant="tourist" />
        <div className="text-center py-20 text-gray-500">Cargando reserva...</div>
      </div>
    );
  }

  // No encontrada
  if (reservation === null) return <Navigate to="/turista/reservas" replace />;

  const uiStatus = statusUi[reservation.status] ?? reservation.status;

  const handleCancel = async () => {
    if (!confirm('¿Cancelar esta reserva? Solo puedes hacerlo con más de 24 horas de anticipación.')) return;
    try {
      await cancelReservationApi(reservation.id);
      toast.success('Reserva cancelada. La factura ha sido anulada.');
      navigate('/turista/reservas');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cancelar');
    }
  };

  const handleSubmitReview = async () => {
    if (stars === 0) { toast.error('Selecciona una calificación'); return; }
    try {
      setSubmitting(true);
      await apiClient.post(`/reservation/${reservation.id}/review`, { rating: stars, comment: review });
      toast.success('¡Gracias por tu calificación!');
      setShowRateModal(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al enviar calificación');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="tourist" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/turista/reservas" className="text-primary hover:underline mb-4 inline-block">
          ← Volver a mis reservas
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Playfair Display' }}>
                Detalle de Reserva
              </h1>
              <p className="text-gray-600">{reservation.reservationNumber}</p>
            </div>
            <StatusBadge status={uiStatus as any} />
          </div>

          <h2 className="text-2xl font-semibold mb-6">{reservation.tourName}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="font-semibold">Fecha del tour</p>
                <p className="text-gray-700">{new Date(reservation.tourDate).toLocaleDateString('es-CO')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="font-semibold">Total pagado</p>
                <p className="text-gray-700">${reservation.amount.toLocaleString('es-CO')} COP</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">El detalle completo del tour (punto de encuentro, vehículo) está disponible en la app.</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            {uiStatus === 'Confirmada' && (
              <Button variant="destructive" onClick={handleCancel}>Cancelar reserva</Button>
            )}
            {uiStatus === 'Completada' && (
              <>
                <Button variant="outline" onClick={() => setShowRateModal(true)}>
                  <Star className="h-4 w-4 mr-2" />Calificar tour
                </Button>
                <Link to="/turista/facturas">
                  <Button variant="outline">Ver mi factura</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Calificar tour</h2>
                <p className="text-sm text-gray-600 mt-1">{reservation.tourName}</p>
              </div>
              <button onClick={() => setShowRateModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Calificación</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star}
                      className={`w-8 h-8 cursor-pointer transition-colors ${stars >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      onClick={() => setStars(star)} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reseña (opcional)</label>
                <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={4}
                  placeholder="Cuéntanos tu experiencia..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRateModal(false)}>Cancelar</Button>
              <Button onClick={handleSubmitReview} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar calificación'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
