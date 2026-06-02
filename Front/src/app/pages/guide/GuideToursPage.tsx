import { Navigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Car, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { type ApiAssignedTour, getMyToursAsGuideApi } from '../../lib/api/services/guideService';
import { apiClient } from '../../lib/api/client';

type TouristInTour = { id: number; touristName: string; tourDate: string };

export function GuideToursPage() {
  const { user, isAuthenticated } = useAuth();
  const [tours, setTours] = useState<ApiAssignedTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<ApiAssignedTour | null>(null);
  const [touristList, setTouristList] = useState<TouristInTour[]>([]);
  const [loadingTourists, setLoadingTourists] = useState(false);

  if (!isAuthenticated || user?.role !== 'Guía') return <Navigate to="/login" replace />;

  useEffect(() => {
    getMyToursAsGuideApi()
      .then(setTours)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error al cargar tours'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="guide" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>Mis Tours Asignados</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando tours...</div>
        ) : tours.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">No tienes tours asignados actualmente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold">{tour.name}</h3>
                    <p className="text-gray-600">{tour.category} · {tour.city}</p>
                  </div>
                  <StatusBadge status={tour.status === 'Active' ? 'Activo' : 'Inactivo'} />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-gray-600">Fecha y hora</p>
                    <p className="font-semibold">{new Date(tour.startTime).toLocaleDateString('es-CO')} — {new Date(tour.startTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Cupos</p>
                    <p className="font-semibold">{tour.totalCapacity - tour.availableCapacity} / {tour.totalCapacity} confirmados</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Punto de encuentro</p>
                    <p className="font-semibold">{tour.meetingPoint}</p>
                  </div>
                </div>

                {tour.vehicle && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">Datos de transporte</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                      <div><span className="font-medium">Placa:</span> {tour.vehicle.licensePlate}</div>
                      <div><span className="font-medium">Marca:</span> {tour.vehicle.brand}</div>
                      <div><span className="font-medium">Modelo:</span> {tour.vehicle.model}</div>
                      <div><span className="font-medium">Capacidad:</span> {tour.vehicle.passengerCapacity} pasajeros</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={async () => {
                    setSelectedTour(tour);
                    setTouristList([]);
                    setLoadingTourists(true);
                    try {
                      const data = await apiClient.get<TouristInTour[]>(`/guide/tours/${tour.id}/tourists`);
                      setTouristList(data);
                    } catch {
                      toast.error('No se pudo cargar el listado de turistas');
                    } finally {
                      setLoadingTourists(false);
                    }
                  }}>
                    <Users className="h-4 w-4 mr-1" />Ver turistas
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTour && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Turistas confirmados</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedTour.name}</p>
              </div>
              <button onClick={() => setSelectedTour(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-3">
                Cupos ocupados: <strong>{selectedTour.totalCapacity - selectedTour.availableCapacity}</strong> / {selectedTour.totalCapacity}
              </p>
              {loadingTourists ? (
                <p className="text-sm text-gray-500">Cargando turistas...</p>
              ) : touristList.length === 0 ? (
                <p className="text-sm text-gray-500">No hay turistas confirmados para este tour.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b">
                    <th className="text-left py-1 font-medium text-gray-600">Nombre</th>
                    <th className="text-left py-1 font-medium text-gray-600">Fecha reservada</th>
                  </tr></thead>
                  <tbody>
                    {touristList.map((t) => (
                      <tr key={t.id} className="border-b last:border-0">
                        <td className="py-2">{t.touristName}</td>
                        <td className="py-2 text-gray-500">{new Date(t.tourDate).toLocaleDateString('es-CO')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <Button onClick={() => setSelectedTour(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
