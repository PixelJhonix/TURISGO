import { apiClient } from '../client';

export type ApiReservation = {
  id: number;
  reservationNumber: string;
  tourId: number;
  tourName: string;
  agencyName: string;
  tourDate: string;
  status: string;
  amount: number;
};

export async function createReservationApi(payload: {
  tourId: number;
  tourDate: string;
  tourScheduleId?: number;
  startTime?: string;
  endTime?: string;
}) {
  return apiClient.post<{ id: number; reservationNumber: string; message: string }>('/reservation', payload);
}

// HU-39: listado real de reservas del turista
export async function getMyReservationsApi(): Promise<ApiReservation[]> {
  return apiClient.get<ApiReservation[]>('/reservation/my');
}

// HU-44: cancelar con RN-08 (24h)
export async function cancelReservationApi(id: number) {
  return apiClient.patch(`/reservation/${id}/cancel`);
}

// HU-42: completar reserva (agencia)
export async function completeReservationApi(id: number) {
  return apiClient.patch(`/reservation/${id}/complete`);
}

// HU-40: reservas de la agencia autenticada
export async function getAgencyReservationsApi(): Promise<ApiReservation[]> {
  return apiClient.get<ApiReservation[]>('/reservation/agency');
}
