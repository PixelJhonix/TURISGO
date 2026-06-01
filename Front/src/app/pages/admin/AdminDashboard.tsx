import { Navigate, Link } from 'react-router';
import { Users, Building2, Package, DollarSign, AlertCircle } from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../lib/auth';
import { useEffect, useState } from 'react';
import { getAdminUsersApi } from '../../lib/api/services/adminService';
import { getToursApi } from '../../lib/api/services/tourService';
import { getAdminInvoicesApi } from '../../lib/api/services/adminInvoiceService';
import type { Tour, User } from '../../lib/mockData';
import type { AdminInvoiceUI } from '../../lib/api/services/adminInvoiceService';

export function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [invoices, setInvoices] = useState<AdminInvoiceUI[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated || user?.role !== 'Administrador') {
    return <Navigate to="/login" replace />;
  }

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [usersRes, toursRes, invoicesRes] = await Promise.all([
        getAdminUsersApi(),
        getToursApi(),
        getAdminInvoicesApi(),
      ]);
      setAdminUsers(usersRes);
      setTours(toursRes);
      setInvoices(invoicesRes);
    } catch (e) {
      // Silencioso: dashboard de MVP puede quedarse incompleto si fallan algunas APIs
      setAdminUsers([]);
      setTours([]);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingAgencies = adminUsers.filter((u) => u.role === 'Agencia' && u.status === 'Pendiente');
  const activeTours = tours.filter((t) => t.status === 'Activo');

  const now = new Date();
  const thisMonthRevenue = invoices
    .filter((inv) => {
      const d = new Date(inv.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && inv.status === 'Emitida';
    })
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="admin" />

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>
            Panel Administrativo
          </h1>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '—' : adminUsers.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agencias Pendientes</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '—' : pendingAgencies.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tours Activos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '—' : activeTours.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos este mes</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '—' : `$${(thisMonthRevenue / 1000).toFixed(0)}k`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? '' : `$${thisMonthRevenue.toLocaleString('es-CO')}`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals */}
          {!loading && pendingAgencies.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <h2 className="text-xl font-semibold">Solicitudes Pendientes de Aprobación</h2>
              </div>
              <div className="space-y-3">
                {pendingAgencies.map((agency) => (
                  <div key={agency.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{agency.name}</p>
                      <p className="text-sm text-gray-600">{agency.email}</p>
                    </div>
                    <Link to="/admin/usuarios">
                      <Button size="sm">Revisar</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MVP: actividad reciente todavía no disponible en backend */}
          {!loading && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
              <p className="text-gray-600">
                Este módulo de auditoría se completará cuando existan endpoints de eventos/reservas en el backend.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
