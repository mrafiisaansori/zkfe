import { get, getWithMeta, post, put, type ApiDataWithMeta, type PaginationMeta } from './api';
import type { OpenBill, OpenBillStatus, CheckoutResult } from '@/types';

export interface OpenBillItemInput {
  id_produk: number;
  qty: number;
  note?: string;
}

export interface OpenBillInput {
  customer_name?: string;
  table_no?: string;
  note?: string;
  items: OpenBillItemInput[];
}

export interface OpenBillPayInput {
  id_jenis_bayar: number;
  bayar?: number;
  diskon?: number;
  keterangan?: string;
}

// Catatan keamanan: id_user & merchant_id TIDAK dikirim dari frontend —
// backend mengambilnya dari token (sesi login).
export const openBillService = {
  list: (params?: { status?: OpenBillStatus; search?: string; page?: number; limit?: number }) =>
    get<OpenBill[]>('/open-bill', params as Record<string, unknown>),
  listPage: (params?: { status?: OpenBillStatus; search?: string; page?: number; limit?: number }): Promise<ApiDataWithMeta<OpenBill[], PaginationMeta>> =>
    getWithMeta<OpenBill[]>('/open-bill', params as Record<string, unknown>),
  getById: (id: number) => get<OpenBill>(`/open-bill/${id}`),
  create: (data: OpenBillInput) => post<OpenBill>('/open-bill', data),
  update: (id: number, data: OpenBillInput) => put<OpenBill>(`/open-bill/${id}`, data),
  pay: (id: number, data: OpenBillPayInput) =>
    post<CheckoutResult & { no_bill: string }>(`/open-bill/${id}/pay`, data),
  cancel: (id: number) => post(`/open-bill/${id}/cancel`),
};
