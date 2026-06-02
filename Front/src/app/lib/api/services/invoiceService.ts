import { apiClient } from '../client';

export type ApiInvoiceTourist = {
  id: number;
  invoiceNumber: string;
  tourName: string;
  issuedAt: string;
  amount: number;
  status: string;
};

export type ApiInvoiceAgency = {
  id: number;
  invoiceNumber: string;
  tourName: string;
  issuedAt: string;
  amount: number;
  retentionAmount: number;
  netAmount: number;
  status: string;
  isManual: boolean;
};

export type ApiAdminBillingReport = {
  periodStart: string;
  periodEnd: string;
  totalGross: number;
  totalRetention: number;
  totalNet: number;
  totalIssued: number;
  totalVoided: number;
  totalCompletedReservations: number;
  byAgency: {
    agencyId: number;
    agencyName: string;
    issued: number;
    voided: number;
    gross: number;
    retention: number;
    net: number;
  }[];
};

// HU-48: facturas del turista
export async function getMyInvoicesApi(): Promise<ApiInvoiceTourist[]> {
  return apiClient.get<ApiInvoiceTourist[]>('/invoice/my');
}

// HU-49: facturas de la agencia con filtro fechas
export async function getAgencyInvoicesApi(start?: string, end?: string): Promise<ApiInvoiceAgency[]> {
  const params = new URLSearchParams();
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  const qs = params.toString() ? `?${params}` : '';
  return apiClient.get<ApiInvoiceAgency[]>(`/invoice/agency${qs}`);
}

// HU-50: reporte admin
export async function getAdminBillingReportApi(start: string, end: string): Promise<ApiAdminBillingReport> {
  return apiClient.get<ApiAdminBillingReport>(`/invoice/admin/report?start=${start}&end=${end}`);
}
