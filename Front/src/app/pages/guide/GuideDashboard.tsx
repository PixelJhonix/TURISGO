import { Navigate, Link } from 'react-router';
import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '../../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { type ApiAssignedTour, getMyToursAsGuideApi } from '../../lib/api/services/guideService';

export function GuideDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [tours, setTours] = useState<ApiAssignedTour[]>([]);
  const [loading, setLoading] = useState(true);

  if (!isAuthenticated || user?.role !== 'Guía') return <Navigate to="/login" replace />;

  useEffect(() => {
    getMyToursAsGuideApi()
      .then(setTours)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error al cargar tours'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const now = new Date();
  const nextTour = tours.find(t => new Date(t.startTime) > now);

  // Alerta de certificado viene del login (AlertMessage en JWT Strategy)
  // La fecha de vencimiento está en los datos del guía (no en el auth context simplificado)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="guide" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>
          Hola, {user.name}
        </h1>

        {/* Próximo tour */}
        {!loading && nextTour && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Tu próximo tour</h2>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-1">{nextTour.name}</h3>
                <p className="text-gray-600">{nextTour.category} · {nextTour.city}</p>
                <div className="mt-3 space-y-1 text-sm">
                  <p><strong>Fecha:</strong> {new Date(nextTour.startTime).toLocaleDateString('es-CO')}</p>
                  <p><strong>Hora:</strong> {new Date(nextTour.startTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p><strong>Punto de encuentro:</strong> {nextTour.meetingPoint}</p>
                  <p><strong>Turistas confirmados:</strong> {nextTour.totalCapacity - nextTour.availableCapacity}</p>
                </div>
              </div>
              <StatusBadge status="Activo" />
            </div>
            <Link to="/guia/tours">
              <Button className="mt-4">Ver todos mis tours</Button>
            </Link>
          </div>
        )}

        {/* Agenda */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mi agenda</h2>
          {loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : tours.length === 0 ? (
            <p className="text-gray-500">No tienes tours asignados actualmente</p>
          ) : (
            <div className="space-y-3">
              {tours.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-gray-600">{new Date(t.startTime).toLocaleDateString('es-CO')}</p>
                  </div>
                  <StatusBadge status={t.status === 'Active' ? 'Activo' : 'Inactivo'} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Períodos de no disponibilidad</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Gestiona tus días no disponibles</p>
              <Link to="/guia/disponibilidad">
                <Button variant="outline">Gestionar disponibilidad</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Mi certificado</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Comunícate con tu agencia si necesitas actualizar el certificado.</p>
              <Button variant="outline" disabled>Solicitar actualización</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
