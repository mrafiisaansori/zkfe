import { get, getWithMeta, post, put, type ApiDataWithMeta, type PaginationMeta } from './api';
import type { OpenBill, OpenBillStatus, CheckoutResult, MidtransSnapResult } from '@/types';

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

export interface OpenBillPartialPayInput extends OpenBillPayInput {
  payer_name?: string;
  items: { id_open_bill_detail: number; qty: number }[];
}

export interface OpenBillPartialQrisInput {
  payer_name?: string;
  items: { id_open_bill_detail: number; qty: number }[];
  id_jenis_bayar: number;
  diskon?: number;
  keterangan?: string;
  customer_name?: string;
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
  payPartial: (id: number, data: OpenBillPartialPayInput) =>
    post<CheckoutResult & { no_bill: string; split_no: number; payer_name: string; bill_status: OpenBillStatus; remaining_total: number }>(`/open-bill/${id}/pay-partial`, data),
  createPartialQris: (id: number, data: OpenBillPartialQrisInput) =>
    post<MidtransSnapResult>(`/open-bill/${id}/pay-partial/qris/create`, data),
  cancel: (id: number) => post(`/open-bill/${id}/cancel`),
};
