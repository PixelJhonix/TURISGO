import { useState, useEffect } from 'react';
import { Navigate, useParams, useNavigate, Link } from 'react-router';
import { Check, AlertTriangle, Truck, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Sidebar } from '../../components/Sidebar';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { getAgencyVehiclesApi, type ApiVehicle } from '../../lib/api/services/vehicleService';
import { apiClient } from '../../lib/api/client';

export function AgencyAssignVehiclePage() {
  const { user, isAuthenticated } = useAuth();
  const { tourId } = useParams();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [tourCapacity, setTourCapacity] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  if (!isAuthenticated || user?.role !== 'Agencia') return <Navigate to="/login" replace />;
  if (!tourId) return <Navigate to="/agencia/tours" replace />;

  useEffect(() => {
    Promise.all([
      getAgencyVehiclesApi(),
      apiClient.get<{ totalCapacity: number }>(`/tour/${tourId}`).catch(() => ({ totalCapacity: 0 })),
    ]).then(([v, tourData]) => {
      setVehicles(v);
      setTourCapacity((tourData as any).totalCapacity ?? 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [tourId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAssignVehicle = async () => {
    if (!selectedVehicle) return;
    try {
      setAssigning(true);
      await apiClient.post(`/tour/${tourId}/vehicle`, { vehicleId: selectedVehicle });
      toast.success('Vehículo asignado. El tour se activará automáticamente si ya tiene guía.');
      navigate('/agencia/tours');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al asignar vehículo');
    } finally {
      setAssigning(false);
    }
  };

  const statusUi: Record<string, string> = { Available: 'Disponible', Assigned: 'Ocupado', InMaintenance: 'En mantenimiento' };

  const isVehicleSelectable = (v: ApiVehicle) =>
    v.status === 'Available' && v.passengerCapacity >= tourCapacity;

  const getTooltipText = (v: ApiVehicle) => {
    if (v.status === 'InMaintenance') return 'En mantenimiento, no disponible';
    if (v.status === 'Assigned') return 'Ya asignado a otro tour';
    if (v.passengerCapacity < tourCapacity) return `Capacidad insuficiente (${v.passengerCapacity}/${tourCapacity})`;
    return '';
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar variant="agency" />
        <div className="flex-1 flex items-center justify-center text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar variant="agency" />
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link to="/agencia/tours" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
              <ArrowLeft className="h-4 w-4 mr-1" />Volver a Tours
            </Link>
            <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>Asignar Vehículo</h1>
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-2">No tienes vehículos en tu flota</h3>
              <p className="text-gray-600 mb-6">Registra uno primero para poder asignarlo.</p>
              <Link to="/agencia/flota"><Button>Ir a Gestión de Flota</Button></Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedVehicleObj = vehicles.find((v) => v.id === selectedVehicle);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="agency" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/agencia/tours" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-4 w-4 mr-1" />Volver a Tours
          </Link>
          <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>Asignar Vehículo</h1>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <p className="text-sm text-gray-600 mb-1">Tour ID: {tourId}</p>
            <p className="text-sm text-gray-600">Cupo requerido: <strong>{tourCapacity} personas</strong></p>
          </div>

          {/* Error banner si el vehículo seleccionado no cumple */}
          {selectedVehicleObj && !isVehicleSelectable(selectedVehicleObj) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{getTooltipText(selectedVehicleObj)}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            {vehicles.map((vehicle) => {
              const selectable = isVehicleSelectable(vehicle);
              const selected = selectedVehicle === vehicle.id;
              return (
                <div key={vehicle.id}
                  onClick={() => selectable && setSelectedVehicle(vehicle.id)}
                  title={getTooltipText(vehicle)}
                  className={`bg-white rounded-lg shadow-sm p-6 transition-all
                    ${selectable ? 'cursor-pointer hover:shadow-md' : 'opacity-40 cursor-not-allowed'}
                    ${selected ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${selected ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                      {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className="w-20 h-14 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      <Truck className="h-7 w-7 text-gray-400" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><p className="text-xs text-gray-600 mb-1">Placa</p><p className="font-medium">{vehicle.licensePlate}</p></div>
                      <div><p className="text-xs text-gray-600 mb-1">Marca/Modelo</p><p className="font-medium">{vehicle.brand} {vehicle.model}</p></div>
                      <div><p className="text-xs text-gray-600 mb-1">Capacidad</p><p className="font-medium">{vehicle.passengerCapacity} personas</p></div>
                      <div><p className="text-xs text-gray-600 mb-1">Estado</p><StatusBadge status={statusUi[vehicle.status] ?? vehicle.status} /></div>
                    </div>
                    <div className="flex-shrink-0">
                      {vehicle.passengerCapacity >= tourCapacity && vehicle.status === 'Available'
                        ? <Check className="h-5 w-5 text-green-600" />
                        : <AlertTriangle className="h-5 w-5 text-red-600" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/agencia/tours')}>Cancelar</Button>
            <Button onClick={handleAssignVehicle}
              disabled={!selectedVehicle || !isVehicleSelectable(selectedVehicleObj!) || assigning}>
              {assigning ? 'Asignando...' : 'Asignar vehículo seleccionado'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
