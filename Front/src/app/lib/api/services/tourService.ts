import type { Tour } from '../../mockData';
import { apiClient } from '../client';
import { tourStatusToUi } from '../mappers';

type ApiTour = {
  id: number;
  name: string;
  description: string;
  category: string;
  city: string;
  price: number;
  totalCapacity: number;
  availableCapacity: number;
  meetingPoint: string;
  startTime: string;
  durationMinutes: number;
  averageRating: number;
  status: string;
  guideId: number | null;
  vehicleId: number | null;
  imagePlaceholder: string | null;
  agencyId: number;
  agencyName: string;
};

export async function getToursApi(): Promise<Tour[]> {
  const items = await apiClient.get<ApiTour[]>('/tour');
  return items.map((item) => ({
    id: String(item.id),
    name: item.name,
    description: item.description || '',
    category: (item.category as Tour['category']) || 'Cultura',
    price: item.price,
    duration: Math.round((item.durationMinutes || 240) / 60),
    maxCapacity: item.totalCapacity ?? item.availableCapacity,
    availableSpots: item.availableCapacity,
    rating: item.averageRating ?? 0,
    city: item.city,
    meetingPoint: item.meetingPoint || '',
    date: item.startTime ? item.startTime.slice(0, 10) : new Date().toISOString().slice(0, 10),
    time: item.startTime ? item.startTime.slice(11, 16) : '09:00',
    images: item.imagePlaceholder ? [item.imagePlaceholder] : [],
    agencyId: String(item.agencyId),
    agencyName: item.agencyName ?? '',
    status: tourStatusToUi[item.status] || 'Inactivo',
  }));
}

export async function setTourStatusApi(tourId: number, status: 'Active' | 'Inactive' | 'Activo' | 'Inactivo') {
  return apiClient.patch(`/tour/${tourId}/status`, { status });
}
