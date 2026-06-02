import { useState } from 'react';
import { Navigate } from 'react-router';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../lib/auth';
import { updateProfileApi, deleteAccountApi } from '../../lib/api/services/touristService';

export function TouristProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isAuthenticated || user?.role !== 'Turista') return <Navigate to="/login" replace />;

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfileApi({ fullName: formData.name, phone: formData.phone || undefined });
      toast.success('Perfil actualizado correctamente');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await deleteAccountApi(confirmPassword);
      toast.success('Cuenta eliminada. ¡Hasta pronto!');
      setTimeout(() => logout(), 1500);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar cuenta');
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="tourist" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>Mi Perfil</h1>
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-3xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" value={user.email} disabled className="bg-gray-100" />
              <p className="text-sm text-gray-500 mt-1">El correo no se puede modificar</p>
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <Button onClick={handleSave} type="button" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Zona de peligro</h3>
            <p className="text-gray-600 mb-4">Una vez elimines tu cuenta, no podrás recuperarla.</p>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>Eliminar mi cuenta</Button>
          </div>
        </div>
      </div>

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Confirmar eliminación</h3>
              <button className="text-gray-500" onClick={() => setShowDeleteDialog(false)}><X /></button>
            </div>
            <p className="text-gray-600 mb-4">Ingresa tu contraseña para confirmar. No puedes tener reservas activas.</p>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Contraseña" />
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteAccount}
                disabled={confirmPassword.length < 6 || deleting}>
                {deleting ? 'Eliminando...' : 'Eliminar cuenta'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
