import { apiClient } from '../client';
import { roleToUi, userStatusToUi } from '../mappers';
import type { User } from '../../mockData';

type ApiAdminUser = {
  id: number;
  name: string;
  email: string;
  role: string; // Tourist|Agency|Guide|Admin
  status: string; // Active|Pending|Suspended
  commissionPercentage?: number | null;
};

export async function getAdminUsersApi(): Promise<User[]> {
  const items = await apiClient.get<ApiAdminUser[]>('/admin/users');
  return items.map((u) => ({
    id: String(u.id),
    name: u.name,
    email: u.email,
    role: roleToUi[u.role] || 'Turista',
    status: userStatusToUi[u.status] || 'Activo',
  }));
}

export async function approveAgencyApi(agencyId: number, commissionPercentage: number) {
  await apiClient.patch(`/admin/agencies/${agencyId}/approve`, { commissionPercentage });
}

// HU-13 CA-01: motivo requerido en backend
export async function suspendUserApi(userId: number, reason: string) {
  await apiClient.patch(`/admin/users/${userId}/suspend`, { reason });
}

// HU-09 CA-03 / HU-13 CA-02: eliminar con validación reservas activas
export async function deleteUserApi(userId: number) {
  await apiClient.del(`/admin/users/${userId}`);
}

