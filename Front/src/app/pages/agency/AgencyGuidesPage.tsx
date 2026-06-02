import { Navigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Sidebar } from '../../components/Sidebar';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import {
  type ApiGuide,
  getAgencyGuidesApi,
  registerGuideApi,
  updateCertificateApi,
} from '../../lib/api/services/guideService';

export function AgencyGuidesPage() {
  const { user, isAuthenticated } = useAuth();
  const [guides, setGuides] = useState<ApiGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showUpdateCertDialog, setShowUpdateCertDialog] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<ApiGuide | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', documentNumber: '',
    certificateNumber: '', certificateExpiry: '',
  });
  const [updateCertData, setUpdateCertData] = useState({
    newCertificateNumber: '', newExpiryDate: '',
  });

  if (!isAuthenticated || user?.role !== 'Agencia') return <Navigate to="/login" replace />;

  const load = async () => {
    try {
      setGuides(await getAgencyGuidesApi());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar guías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => setFormData({ name: '', email: '', password: '', documentNumber: '', certificateNumber: '', certificateExpiry: '' });

  const handleRegisterGuide = async () => {
    try {
      await registerGuideApi({
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
        documentNumber: formData.documentNumber,
        certificateNumber: formData.certificateNumber,
        certificateExpiryDate: new Date(formData.certificateExpiry).toISOString(),
      });
      toast.success(`Guía ${formData.name} registrado exitosamente`);
      setShowDialog(false);
      resetForm();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al registrar guía');
    }
  };

  const handleUpdateCertificate = async () => {
    if (!selectedGuide) return;
    try {
      await updateCertificateApi(selectedGuide.id, {
        newCertificateNumber: updateCertData.newCertificateNumber,
        newExpiryDate: new Date(updateCertData.newExpiryDate).toISOString(),
      });
      toast.success('Certificado actualizado. El guía ahora está disponible');
      setShowUpdateCertDialog(false);
      setSelectedGuide(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar certificado');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="agency" />
      <div className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Playfair Display' }}>Gestión de Guías</h1>
          <Button onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-2" />Registrar nuevo guía</Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando guías...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            {guides.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No tienes guías registrados</div>
            ) : (
              guides.map((guide) => (
                <div key={guide.id} className="flex items-center justify-between p-6 border-b last:border-b-0">
                  <div>
                    <p className="font-semibold text-lg">{guide.fullName}</p>
                    <p className="text-sm text-gray-600 mt-1">{guide.email}</p>
                    <p className="text-sm text-gray-600">Cert: {guide.certificateNumber}</p>
                    <p className={`text-sm ${guide.daysToExpiry < 30 ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                      Vence: {new Date(guide.certificateExpiryDate).toLocaleDateString('es-CO')}
                      {guide.daysToExpiry < 30 && ` (${guide.daysToExpiry} días)`}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <StatusBadge status={guide.status === 'Active' ? 'Activo' : 'Inactivo'} />
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelectedGuide(guide);
                      setUpdateCertData({ newCertificateNumber: guide.certificateNumber, newExpiryDate: '' });
                      setShowUpdateCertDialog(true);
                    }}>
                      Actualizar certificado
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Register Dialog */}
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-5 border-b flex items-start justify-between">
              <h2 className="text-xl font-semibold">Registrar nuevo guía</h2>
              <button onClick={() => { setShowDialog(false); resetForm(); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: 'Nombre completo', field: 'name', type: 'text', placeholder: 'María Fernanda López' },
                { label: 'Correo', field: 'email', type: 'email', placeholder: 'guia@ejemplo.com' },
                { label: 'Contraseña temporal', field: 'password', type: 'password', placeholder: '••••••••' },
                { label: 'Número de documento', field: 'documentNumber', type: 'text', placeholder: '123456789' },
                { label: 'Número de certificado', field: 'certificateNumber', type: 'text', placeholder: 'CERT-2024-XXXXX' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={(formData as any)[field]} placeholder={placeholder}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento del certificado</label>
                <input type="date" value={formData.certificateExpiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, certificateExpiry: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={handleRegisterGuide}>Registrar guía</Button>
            </div>
          </div>
        </div>
      )}

      {/* Update Certificate Dialog */}
      {showUpdateCertDialog && selectedGuide && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Actualizar certificado</h2>
                <p className="text-sm text-gray-600 mt-1">Guía: {selectedGuide.fullName}</p>
              </div>
              <button onClick={() => { setShowUpdateCertDialog(false); setSelectedGuide(null); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo número de certificado</label>
                <input type="text" value={updateCertData.newCertificateNumber}
                  onChange={(e) => setUpdateCertData(prev => ({ ...prev, newCertificateNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva fecha de vencimiento</label>
                <input type="date" value={updateCertData.newExpiryDate}
                  onChange={(e) => setUpdateCertData(prev => ({ ...prev, newExpiryDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowUpdateCertDialog(false); setSelectedGuide(null); }}>Cancelar</Button>
              <Button onClick={handleUpdateCertificate}>Guardar cambios</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
