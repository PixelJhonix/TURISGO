import { apiClient } from '../client';

export type ApiVehicle = {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  passengerCapacity: number;
  status: string;
};

// HU-27: listar flota
export async function getAgencyVehiclesApi(): Promise<ApiVehicle[]> {
  return apiClient.get<ApiVehicle[]>('/vehicle');
}

// HU-27 CA-01: registrar vehículo
export async function registerVehicleApi(payload: {
  licensePlate: string; brand: string; model: string; year: number; passengerCapacity: number;
}) {
  return apiClient.post<ApiVehicle>('/vehicle', payload);
}

// HU-32: cambiar estado
export async function changeVehicleStatusApi(id: number, status: string) {
  return apiClient.patch(`/vehicle/${id}/status`, { status });
}

// HU-34: eliminar
export async function deleteVehicleApi(id: number) {
  return apiClient.del(`/vehicle/${id}`);
}
