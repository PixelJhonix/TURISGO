import { Navigate, Link } from 'react-router';
import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Sidebar } from '../../components/Sidebar';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { getToursApi } from '../../lib/api/services/tourService';
import { getAgencyGuidesApi, type ApiGuide } from '../../lib/api/services/guideService';
import { apiClient } from '../../lib/api/client';
import type { Tour } from '../../lib/mockData';

export function AgencyToursPage() {
  const { user, isAuthenticated } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [guides, setGuides] = useState<ApiGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showAssignGuideDialog, setShowAssignGuideDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [editFormData, setEditFormData] = useState({ description: '', price: 0, meetingPoint: '', maxCapacity: 0 });

  if (!isAuthenticated || user?.role !== 'Agencia') return <Navigate to="/login" replace />;

  const load = async () => {
    try {
      const [allTours, agencyGuides] = await Promise.all([getToursApi(), getAgencyGuidesApi()]);
      setTours(allTours);
      setGuides(agencyGuides);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // getToursApi solo devuelve activos; pedimos todos para la agencia usando el endpoint admin/agency
  const agencyTours = tours;

  const handleAssignGuide = async (guideId: number) => {
    if (!selectedTour) return;
    try {
      await apiClient.post(`/tour/${selectedTour.id}/guides`, { guideId });
      const guide = guides.find(g => g.id === guideId);
      toast.success(`Guía ${guide?.fullName} asignado. El tour se activó automáticamente si ya tiene vehículo.`);
      setShowAssignGuideDialog(false);
      setSelectedTour(null);
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Error al asignar guía'); }
  };

  const handleSaveEdit = async () => {
    if (!selectedTour) return;
    try {
      await apiClient.put(`/tour/${selectedTour.id}`, {
        name: selectedTour.name,
        description: editFormData.description,
        category: selectedTour.category,
        city: selectedTour.city,
        price: editFormData.price,
        totalCapacity: editFormData.maxCapacity,
        startTime: new Date(selectedTour.date + 'T' + selectedTour.time).toISOString(),
        durationMinutes: selectedTour.duration * 60,
        meetingPoint: editFormData.meetingPoint,
      });
      toast.success('Tour actualizado correctamente');
      setShowEditDialog(false);
      setSelectedTour(null);
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Error al actualizar'); }
  };

  const handleDeactivateTour = async () => {
    if (!selectedTour) return;
    if (!deactivateReason.trim()) { toast.error('El motivo es obligatorio'); return; }
    try {
      await apiClient.patch(`/tour/${selectedTour.id}/deactivate`, { reason: deactivateReason });
      toast.success('Servicio desactivado');
      setShowDeactivateDialog(false);
      setSelectedTour(null);
      setDeactivateReason('');
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Error al desactivar'); }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="agency" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Playfair Display' }}>Gestión de Tours</h1>
            <Link to="/agencia/tours/nuevo">
              <Button><Plus className="h-4 w-4 mr-2" />Crear nuevo tour</Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Cargando tours...</div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cupos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agencyTours.map((tour) => (
                    <tr key={tour.id}>
                      <td className="px-6 py-4"><span className="font-medium">{tour.name}</span></td>
                      <td className="px-6 py-4">{tour.category}</td>
                      <td className="px-6 py-4">${tour.price.toLocaleString('es-CO')}</td>
                      <td className="px-6 py-4">{tour.availableSpots}/{tour.maxCapacity}</td>
                      <td className="px-6 py-4"><StatusBadge status={tour.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedTour(tour);
                            setEditFormData({ description: tour.description, price: tour.price, meetingPoint: tour.meetingPoint, maxCapacity: tour.maxCapacity });
                            setShowEditDialog(true);
                          }}>Editar</Button>
                          {tour.status === 'Activo' && (
                            <Button size="sm" variant="outline" onClick={() => { setSelectedTour(tour); setShowDeactivateDialog(true); }}>
                              Desactivar
                            </Button>
                          )}
                          {!tour.guideId && (
                            <Button size="sm" variant="outline" onClick={() => { setSelectedTour(tour); setShowAssignGuideDialog(true); }}>
                              Asignar guía
                            </Button>
                          )}
                          <Link to={`/agencia/tours/${tour.id}/asignar-vehiculo`}>
                            <Button size="sm" variant="outline">Asignar vehículo</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assign Guide Dialog */}
      {showAssignGuideDialog && selectedTour && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="px-6 py-5 border-b flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Asignar guía al tour</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedTour.name}</p>
              </div>
              <button onClick={() => { setShowAssignGuideDialog(false); setSelectedTour(null); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5">
              {guides.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No tienes guías registrados.</div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 mb-3">Selecciona un guía:</p>
                  {guides.map((guide) => (
                    <div key={guide.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{guide.fullName}</p>
                          <p className="text-sm text-gray-600">Cert: {guide.certificateNumber}</p>
                          <p className={`text-sm ${guide.daysToExpiry < 30 ? 'text-orange-600' : 'text-gray-600'}`}>
                            Vence: {new Date(guide.certificateExpiryDate).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => handleAssignGuide(guide.id)}>Asignar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <Button variant="outline" onClick={() => { setShowAssignGuideDialog(false); setSelectedTour(null); }}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && selectedTour && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-5 border-b flex items-start justify-between">
              <div><h2 className="text-xl font-semibold">Editar tour</h2><p className="text-sm text-gray-600 mt-1">{selectedTour.name}</p></div>
              <button onClick={() => { setShowEditDialog(false); setSelectedTour(null); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: 'Descripción', field: 'description', type: 'textarea' },
                { label: 'Precio (COP)', field: 'price', type: 'number' },
                { label: 'Punto de encuentro', field: 'meetingPoint', type: 'text' },
                { label: 'Cupos máximos', field: 'maxCapacity', type: 'number' },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  {type === 'textarea' ? (
                    <textarea value={(editFormData as any)[field]} rows={3}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                  ) : (
                    <input type={type} value={(editFormData as any)[field]}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, [field]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedTour(null); }}>Cancelar</Button>
              <Button onClick={handleSaveEdit}>Guardar cambios</Button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Dialog — motivo obligatorio (HU-26 CA-02) */}
      {showDeactivateDialog && selectedTour && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b"><h2 className="text-xl font-semibold">Desactivar tour</h2></div>
            <div className="px-6 py-5">
              <p className="text-gray-700 mb-4">¿Desactivar <strong>{selectedTour.name}</strong>? Ingresa el motivo (obligatorio).</p>
              <textarea value={deactivateReason} rows={3}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="Motivo de desactivación..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowDeactivateDialog(false); setSelectedTour(null); setDeactivateReason(''); }}>Cancelar</Button>
              <Button onClick={handleDeactivateTour} disabled={!deactivateReason.trim()}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}