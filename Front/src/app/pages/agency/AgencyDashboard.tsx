import { Navigate, Link } from 'react-router';
import { useState, useEffect } from 'react';
import { Package, Users, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { getAgencyReservationsApi, type ApiReservation } from '../../lib/api/services/reservationService';
import { getAgencyGuidesApi, type ApiGuide } from '../../lib/api/services/guideService';
import { getAgencyInvoicesApi, type ApiInvoiceAgency } from '../../lib/api/services/invoiceService';
import { getAgencyVehiclesApi, type ApiVehicle } from '../../lib/api/services/vehicleService';

export function AgencyDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [reservations, setReservations] = useState<ApiReservation[]>([]);
  const [guides, setGuides] = useState<ApiGuide[]>([]);
  const [invoices, setInvoices] = useState<ApiInvoiceAgency[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);

  if (!isAuthenticated || user?.role !== 'Agencia') {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    Promise.all([
      getAgencyReservationsApi(),
      getAgencyGuidesApi(),
      getAgencyInvoicesApi(),
      getAgencyVehiclesApi(),
    ]).then(([r, g, i, v]) => {
      setReservations(r); setGuides(g); setInvoices(i); setVehicles(v);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeReservations = reservations.filter((r) => r.status === 'Confirmed');
  const now = new Date();
  const thisMonthReservations = reservations.filter((r) => {
    const d = new Date(r.tourDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = invoices
    .filter((i) => { const d = new Date(i.issuedAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((sum, i) => sum + i.netAmount, 0);
  const expiringGuides = guides.filter((g) => g.daysToExpiry < 30 && g.daysToExpiry >= 0);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="agency" />

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold" style={{ fontFamily: 'Playfair Display' }}>
                Panel de control
              </h1>
              <p className="text-gray-600 mt-2">{user.name}</p>
            </div>
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
              Aprobada
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tours Activos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeReservations.length}</div>
                <p className="text-xs text-muted-foreground">confirmadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reservas este mes</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{thisMonthReservations.length}</div>
                <p className="text-xs text-muted-foreground">este mes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos este mes</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(thisMonthRevenue / 1000).toFixed(0)}k</div>
                <p className="text-xs text-muted-foreground">neto este mes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Guías disponibles</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{guides.length}</div>
                <p className="text-xs text-muted-foreground">registrados</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reservations */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Reservas recientes</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Turista</th>
                    <th className="text-left py-3 px-4">Tour</th>
                    <th className="text-left py-3 px-4">Fecha</th>
                    <th className="text-left py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.slice(0, 5).map((reservation) => (
                    <tr key={reservation.id} className="border-b">
                      <td className="py-3 px-4 text-sm">{reservation.reservationNumber}</td>
                      <td className="py-3 px-4">{reservation.tourName}</td>
                      <td className="py-3 px-4">{new Date(reservation.tourDate).toLocaleDateString('es-CO')}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={{ Confirmed: 'Confirmada', Completed: 'Completada', Cancelled: 'Cancelada' }[reservation.status] ?? reservation.status as any} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link to="/agencia/reservas">
              <Button variant="outline" className="mt-4">Ver todas las reservas</Button>
            </Link>
          </div>

          {/* Alertas dinámicas */}
          {expiringGuides.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">Certificados próximos a vencer</h3>
                  {expiringGuides.map((g) => (
                    <p key={g.id} className="text-sm text-orange-800">
                      {g.fullName}: vence en {g.daysToExpiry} días
                    </p>
                  ))}
                  <Link to="/agencia/guias" className="text-sm text-orange-700 underline mt-2 inline-block">Actualizar certificados</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
