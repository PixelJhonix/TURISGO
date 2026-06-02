import { apiClient } from '../client';

// HU-11: actualizar perfil
export async function updateProfileApi(payload: { fullName: string; phone?: string }) {
  return apiClient.put('/tourist/profile', payload);
}

export async function getProfileApi() {
  return apiClient.get<{ id: number; fullName: string; email: string; phone?: string }>('/tourist/profile');
}

// HU-14: eliminar cuenta con contraseña
export async function deleteAccountApi(password: string) {
  return apiClient.del<{ message: string }>(`/tourist/account`);
}
