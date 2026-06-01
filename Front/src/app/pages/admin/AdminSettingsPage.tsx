import { Navigate } from 'react-router';
import { Sidebar } from '../../components/Sidebar';
import { useAuth } from '../../lib/auth';

export function AdminSettingsPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user?.role !== 'Administrador') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="admin" />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Playfair Display' }}>
          Configuración
        </h1>
        <p className="text-gray-600">
          Este módulo está en construcción para el MVP. Aquí se centralizarán ajustes de plataforma y seguridad.
        </p>
      </div>
    </div>
  );
}

