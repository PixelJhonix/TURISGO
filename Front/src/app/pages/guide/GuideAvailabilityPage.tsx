import { Navigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../lib/auth';
import {
  type ApiUnavailability,
  addUnavailabilityApi,
  deleteUnavailabilityApi,
} from '../../lib/api/services/guideService';

export function GuideAvailabilityPage() {
  const { user, isAuthenticated } = useAuth();
  const [periods, setPeriods] = useState<ApiUnavailability[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  if (!isAuthenticated || user?.role !== 'Guía') return <Navigate to="/login" replace />;

  const handleAddPeriod = async () => {
    if (!startDate || !endDate) { toast.error('Completa ambas fechas'); return; }
    if (new Date(startDate) >= new Date(endDate)) { toast.error('La fecha de inicio debe ser anterior a la de fin'); return; }
    try {
      const created = await addUnavailabilityApi({
        startDateTime: new Date(startDate).toISOString(),
        endDateTime: new Date(endDate).toISOString(),
      });
      setPeriods(prev => [...prev, created]);
      toast.success('Período registrado');
      setShowDialog(false);
      setStartDate('');
      setEndDate('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al registrar período');
    }
  };

  const handleDeletePeriod = async (id: number) => {
    try {
      await deleteUnavailabilityApi(id);
      setPeriods(prev => prev.filter(p => p.id !== id));
      toast.success('Período eliminado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar período');
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="guide" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>Gestionar Disponibilidad</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Períodos de no disponibilidad</h2>
              <p className="text-gray-600 text-sm mt-1">Registra los períodos en los que no estarás disponible para tours</p>
            </div>
            <Button onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-2" />Agregar período</Button>
          </div>

          {periods.length === 0 ? (
            <div className="border rounded-lg p-8 text-center text-gray-500">No tienes períodos de no disponibilidad registrados</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 border rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desde</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hasta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periods.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4">{fmt(p.startDateTime)}</td>
                    <td className="px-6 py-4">{fmt(p.endDateTime)}</td>
                    <td className="px-6 py-4">
                      <Button size="sm" variant="destructive" onClick={() => handleDeletePeriod(p.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b flex items-start justify-between">
              <h2 className="text-xl font-semibold">Agregar período de no disponibilidad</h2>
              <button onClick={() => { setShowDialog(false); setStartDate(''); setEndDate(''); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                <input type="date" value={startDate} min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                <input type="date" value={endDate} min={startDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowDialog(false); setStartDate(''); setEndDate(''); }}>Cancelar</Button>
              <Button onClick={handleAddPeriod}>Registrar período</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
