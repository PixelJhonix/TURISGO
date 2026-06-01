import { apiClient, setToken } from '../client';
import { roleToUi } from '../mappers';
import type { User } from '../../mockData';

type LoginResponse = {
  success: boolean;
  token?: string;
  role?: string;
  redirectUrl?: string;
  alertMessage?: string;
  errorMessage?: string;
};

export async function loginApi(email: string, password: string): Promise<{ user: User; alert?: string }> {
  const result = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  if (!result.success || !result.token || !result.role) {
    throw new Error(result.errorMessage || 'No fue posible iniciar sesion');
  }

  setToken(result.token);
  const me = await apiClient.get<{ id: string; email: string; role: string }>('/auth/me');
  const user: User = {
    id: me.id,
    email: me.email,
    name: me.email.split('@')[0],
    role: roleToUi[me.role] || 'Turista',
    status: 'Activo',
  };
  return { user, alert: result.alertMessage || undefined };
}

export async function registerTouristApi(payload: { email: string; password: string; fullName: string; phone?: string }) {
  await apiClient.post('/auth/register/tourist', payload);
}

export async function registerAgencyApi(payload: { email: string; password: string; commercialName: string; nit: string }) {
  await apiClient.post('/auth/register/agency', payload);
}
