import { Link, Navigate, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Calendar, Check, FileText, Package } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { TourCard } from '../../components/TourCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { getMyReservationsApi, type ApiReservation } from '../../lib/api/services/reservationService';
import { getMyInvoicesApi, type ApiInvoiceTourist } from '../../lib/api/services/invoiceService';
import { getToursApi } from '../../lib/api/services/tourService';
import type { Tour } from '../../lib/mockData';

export function TouristDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<ApiReservation[]>([]);
  const [invoices, setInvoices] = useState<ApiInvoiceTourist[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);

  if (!isAuthenticated || user?.role !== 'Turista') {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    Promise.all([getMyReservationsApi(), getMyInvoicesApi(), getToursApi()])
      .then(([r, i, t]) => { setReservations(r); setInvoices(i); setTours(t); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeReservations = reservations.filter((r) => r.status === 'Confirmed');
  const completedReservations = reservations.filter((r) => r.status === 'Completed');
  const nextReservation = activeReservations[0] ?? null;
  const recommendedTours = tours.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="tourist" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Playfair Display' }}>
            Hola, {user.name} 👋
          </h1>
          <p className="text-gray-600">{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Activity Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservas Activas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeReservations.length}</div>
              <p className="text-xs text-muted-foreground">confirmadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tours Completados</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedReservations.length}</div>
              <p className="text-xs text-muted-foreground">tours realizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
              <p className="text-xs text-muted-foreground">emitidas</p>
            </CardContent>
          </Card>
        </div>

        {/* Next Reservation — datos reales */}
        {nextReservation && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Tu próxima reserva</h2>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1 space-y-2 text-gray-700">
                <h3 className="text-xl font-semibold">{nextReservation.tourName}</h3>
                <StatusBadge status={{ Confirmed: 'Confirmada', Completed: 'Completada', Cancelled: 'Cancelada' }[nextReservation.status] ?? nextReservation.status as any} />
                <p className="mt-2"><strong>Fecha:</strong> {new Date(nextReservation.tourDate).toLocaleDateString('es-CO')}</p>
                <p><strong>N° Reserva:</strong> {nextReservation.reservationNumber}</p>
                <p><strong>Total:</strong> ${nextReservation.amount.toLocaleString('es-CO')} COP</p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <Link to={`/turista/reservas/${nextReservation.id}`}>
                  <Button>Ver detalles</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Tours */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Tours recomendados para ti</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedTours.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                showReserveButton
                linkTo={`/tours/${tour.id}`}
                onReserve={(id) => navigate(`/tours/${id}`)}
              />
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-6">Accesos rápidos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/turista/tours">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <Package className="h-6 w-6" />
                <span>Explorar catálogo</span>
              </Button>
            </Link>
            <Link to="/turista/reservas">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <Calendar className="h-6 w-6" />
                <span>Mis reservas</span>
              </Button>
            </Link>
            <Link to="/turista/facturas">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <FileText className="h-6 w-6" />
                <span>Mis facturas</span>
              </Button>
            </Link>
            <Link to="/turista/perfil">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <span className="text-2xl">👤</span>
                <span>Mi perfil</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
