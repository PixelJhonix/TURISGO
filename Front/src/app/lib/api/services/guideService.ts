import { apiClient } from '../client';

export type ApiGuide = {
  id: number;
  fullName: string;
  email: string;
  documentNumber: string;
  certificateNumber: string;
  certificateExpiryDate: string;
  status: string;
  daysToExpiry: number;
};

export type ApiUnavailability = {
  id: number;
  startDateTime: string;
  endDateTime: string;
};

export type ApiAssignedTour = {
  id: number;
  code: string;
  name: string;
  category: string;
  city: string;
  startTime: string;
  durationMinutes: number;
  meetingPoint: string;
  status: string;
  totalCapacity: number;
  availableCapacity: number;
  vehicle: { id: number; licensePlate: string; brand: string; model: string; passengerCapacity: number } | null;
};

// HU-10: listar guías de la agencia
export async function getAgencyGuidesApi(): Promise<ApiGuide[]> {
  return apiClient.get<ApiGuide[]>('/agency/guides');
}

// HU-04: registrar guía
export async function registerGuideApi(payload: {
  fullName: string; email: string; password: string;
  documentNumber: string; certificateNumber: string; certificateExpiryDate: string;
}) {
  return apiClient.post('/agency/guides', payload);
}

// HU-12: actualizar certificado
export async function updateCertificateApi(guideId: number, payload: {
  newCertificateNumber: string; newExpiryDate: string;
}) {
  return apiClient.put(`/agency/guides/${guideId}/certificate`, payload);
}

// HU-22: tours asignados al guía
export async function getMyToursAsGuideApi(): Promise<ApiAssignedTour[]> {
  return apiClient.get<ApiAssignedTour[]>('/guide/tours');
}

// HU-24: períodos de no disponibilidad
export async function addUnavailabilityApi(payload: { startDateTime: string; endDateTime: string }) {
  return apiClient.post<ApiUnavailability>('/guide/unavailability', payload);
}

export async function deleteUnavailabilityApi(id: number) {
  return apiClient.del(`/guide/unavailability/${id}`);
}
