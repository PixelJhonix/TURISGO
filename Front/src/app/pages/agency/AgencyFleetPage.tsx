import { Navigate } from 'react-router';
import { Plus, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Sidebar } from '../../components/Sidebar';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { useState, useEffect } from 'react';
import {
  type ApiVehicle,
  getAgencyVehiclesApi,
  registerVehicleApi,
  changeVehicleStatusApi,
  deleteVehicleApi,
} from '../../lib/api/services/vehicleService';

const vehicleStatusUi: Record<string, string> = {
  Available: 'Disponible', Assigned: 'Ocupado', InMaintenance: 'En mantenimiento',
};

export function AgencyFleetPage() {
  const { user, isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registerFormData, setRegisterFormData] = useState({
    plate: '', brand: '', model: '', year: '', capacity: '',
  });

  if (!isAuthenticated || user?.role !== 'Agencia') return <Navigate to="/login" replace />;

  const load = async () => {
    try {
      setVehicles(await getAgencyVehiclesApi());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar flota');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegisterVehicle = async () => {
    try {
      await registerVehicleApi({
        licensePlate: registerFormData.plate,
        brand: registerFormData.brand,
        model: registerFormData.model,
        year: Number(registerFormData.year),
        passengerCapacity: Number(registerFormData.capacity),
      });
      toast.success('Vehículo registrado correctamente');
      setShowRegisterDialog(false);
      setRegisterFormData({ plate: '', brand: '', model: '', year: '', capacity: '' });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al registrar vehículo');
    }
  };

  const handleChangeStatus = async (vehicle: ApiVehicle) => {
    const newStatus = vehicle.status === 'Available' ? 'InMaintenance' : 'Available';
    const label = newStatus === 'Available' ? 'Disponible' : 'En mantenimiento';
    if (!confirm(`¿Cambiar el estado de ${vehicle.licensePlate} a "${label}"?`)) return;
    try {
      await changeVehicleStatusApi(vehicle.id, newStatus);
      toast.success('Estado actualizado');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cambiar el estado');
    }
  };

  const handleDeleteVehicle = async (vehicle: ApiVehicle) => {
    if (!confirm(`¿Eliminar el vehículo ${vehicle.licensePlate}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteVehicleApi(vehicle.id);
      toast.success('Vehículo eliminado');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo eliminar el vehículo');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="agency" />
      <div className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Playfair Display' }}>Gestión de Flota</h1>
          <Button onClick={() => setShowRegisterDialog(true)}><Plus className="h-4 w-4 mr-2" />Registrar vehículo</Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando flota...</div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg text-gray-500">No tienes vehículos registrados</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vehicles.map((v) => (
              <div key={v.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{v.brand} {v.model}</h3>
                    <p className="text-gray-600">Placa: {v.licensePlate}</p>
                  </div>
                  <StatusBadge status={vehicleStatusUi[v.status] ?? v.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>Año: {v.year}</div>
                  <div>Capacidad: {v.passengerCapacity} pasajeros</div>
                </div>
                <div className="flex gap-2 mt-4">
                  {v.status !== 'Assigned' && (
                    <Button size="sm" variant="outline" onClick={() => handleChangeStatus(v)}>
                      {v.status === 'Available' ? 'Poner en mantenimiento' : 'Marcar disponible'}
                    </Button>
                  )}
                  {v.status !== 'Assigned' && (
                    <Button size="sm" variant="outline" onClick={() => handleDeleteVehicle(v)}>
                      <Trash2 className="h-4 w-4 mr-1" />Eliminar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRegisterDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-5 border-b flex items-start justify-between">
              <h2 className="text-xl font-semibold">Registrar vehículo</h2>
              <button onClick={() => setShowRegisterDialog(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: 'Placa', field: 'plate', placeholder: 'ABC-123' },
                { label: 'Marca', field: 'brand', placeholder: 'Toyota' },
                { label: 'Modelo', field: 'model', placeholder: 'HiAce' },
                { label: 'Año', field: 'year', placeholder: '2024' },
                { label: 'Capacidad de pasajeros', field: 'capacity', placeholder: '15' },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={field === 'capacity' || field === 'year' ? 'number' : 'text'}
                    value={(registerFormData as any)[field]} placeholder={placeholder}
                    onChange={(e) => setRegisterFormData(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>Cancelar</Button>
              <Button onClick={handleRegisterVehicle}>Registrar vehículo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
