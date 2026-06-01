import { apiClient } from '../client';

type ApiInvoice = {
  id: number;
  amount: number;
  status: number; // InvoiceStatus enum numeric (Active=0, Voided=1)
  createdAt: string;
};

export type AdminInvoiceUI = {
  id: string;
  amount: number;
  status: 'Emitida' | 'Anulada';
  createdAt: string;
};

export async function getAdminInvoicesApi(): Promise<AdminInvoiceUI[]> {
  const items = await apiClient.get<ApiInvoice[]>('/invoice');
  return items.map((i) => ({
    id: String(i.id),
    amount: i.amount,
    status: i.status === 0 ? 'Emitida' : 'Anulada',
    createdAt: i.createdAt,
  }));
}

type ApiAdminInvoiceItem = {
  id: number;
  amount: number;
  status: number;
  createdAt: string;
  reservationId: number;
  tourId: number;
  tourName: string;
  agencyId: number;
  agencyName: string;
};

export type AdminInvoiceItemUI = {
  id: string;
  amount: number;
  status: 'Emitida' | 'Anulada';
  createdAt: string;
  reservationId: number;
  tourId: number;
  tourName: string;
  agencyId: number;
  agencyName: string;
};

export async function getAdminInvoiceItemsApi(): Promise<AdminInvoiceItemUI[]> {
  const items = await apiClient.get<ApiAdminInvoiceItem[]>('/invoice/admin/items');
  return items.map((i) => ({
    id: String(i.id),
    amount: i.amount,
    status: i.status === 0 ? 'Emitida' : 'Anulada',
    createdAt: i.createdAt,
    reservationId: i.reservationId,
    tourId: i.tourId,
    tourName: i.tourName,
    agencyId: i.agencyId,
    agencyName: i.agencyName,
  }));
}

