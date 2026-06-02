import { Navigate } from 'react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Sidebar } from '../../components/Sidebar';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../lib/auth';
import { User } from '../../lib/mockData';
import { approveAgencyApi, getAdminUsersApi, suspendUserApi, reactivateUserApi, deleteUserApi } from '../../lib/api/services/adminService';
import { useEffect } from 'react';

export function AdminUsersPage() {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [suspendTarget, setSuspendTarget] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [approveTarget, setApproveTarget] = useState<string | null>(null);
  const [commission, setCommission] = useState('10');
  const [loading, setLoading] = useState(false);
  
  if (!isAuthenticated || user?.role !== 'Administrador') {
    return <Navigate to="/login" replace />;
  }

  const loadUsers = async () => {
    try {
      setLoading(true);
      setUsers(await getAdminUsersApi());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No fue posible cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = (userId: string) => {
    setApproveTarget(userId);
    setCommission('10');
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    const id = Number(approveTarget);
    const c = Number(commission);
    if (!Number.isFinite(id) || id <= 0) {
      toast.error('Id inválido');
      return;
    }
    if (!Number.isFinite(c) || c < 0 || c > 100) {
      toast.error('La comisión debe estar entre 0 y 100');
      return;
    }
    try {
      await approveAgencyApi(id, c);
      toast.success('Agencia aprobada correctamente');
      setApproveTarget(null);
      await loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No fue posible aprobar la agencia');
    }
  };

  const handleSuspend = () => {
    if (!motivo.trim()) {
      toast.error('Debes ingresar un motivo de suspensión');
      return;
    }
    const id = Number(suspendTarget);
    if (!Number.isFinite(id) || id <= 0) {
      toast.error('Id inválido');
      return;
    }
    // HU-13 CA-01: motivo enviado al backend
    suspendUserApi(id, motivo.trim())
      .then(async () => {
        toast.success('Cuenta suspendida');
        setSuspendTarget(null);
        setMotivo('');
        await loadUsers();
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'No fue posible suspender'));
  };

  const roles = ['Todos', 'Turista', 'Agencia', 'Guía', 'Administrador'];
  const filteredUsers = roleFilter === 'Todos' 
    ? users 
    : users.filter(u => u.role === roleFilter);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="admin" />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>
          Gestión de Usuarios
        </h1>
        
        {/* Role Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {roles.map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(role)}
            >
              {role}
            </Button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y">
              {loading ? (
                <tr>
                  <td className="px-6 py-6 text-gray-600" colSpan={5}>Cargando...</td>
                </tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4">{u.name}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">{u.role}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={u.status as any} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Ver</Button>
                      {u.status === 'Pendiente' && (
                        <Button size="sm" onClick={() => handleApprove(u.id)}>
                          Aprobar
                        </Button>
                      )}
                      {u.status === 'Activo' && (
                        <Button size="sm" variant="destructive" onClick={() => setSuspendTarget(u.id)}>
                          Suspender
                        </Button>
                      )}
                      {u.status === 'Suspendido' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-50"
                          onClick={async () => {
                            try {
                              await reactivateUserApi(Number(u.id));
                              toast.success('Cuenta reactivada');
                              await loadUsers();
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : 'No fue posible reactivar');
                            }
                          }}
                        >
                          Reactivar
                        </Button>
                      )}
                      {u.role !== 'Administrador' && (
                        <Button size="sm" variant="outline"
                          onClick={async () => {
                            if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
                            try {
                              await deleteUserApi(Number(u.id));
                              toast.success('Usuario eliminado');
                              await loadUsers();
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : 'No fue posible eliminar');
                            }
                          }}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Dialog */}
      {suspendTarget && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Suspender cuenta</h2>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la suspensión
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--turistgo-primary)]"
                placeholder="Describe el motivo..."
              />
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSuspendTarget(null);
                  setMotivo('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleSuspend}
                disabled={!motivo.trim()}
              >
                Confirmar suspensión
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Dialog */}
      {approveTarget && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Aprobar agencia</h2>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comisión (%)
              </label>
              <input
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                type="number"
                min={0}
                max={100}
                step={0.01}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--turistgo-primary)]"
                placeholder="10"
              />
              <p className="text-xs text-gray-500 mt-2">Se aplica como retención dinámica por contrato.</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setApproveTarget(null);
                  setCommission('10');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmApprove}>
                Aprobar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}