import { get, post } from './api';
import type { Penjualan, CheckoutResult } from '@/types';

export interface CheckoutInput {
  items: { id_produk: number; qty: number; diskon?: number }[];
  id_jenis_bayar: number;
  id_user: number;
  bayar?: number;
  diskon?: number;
  keterangan?: string;
  kode_voucher?: string;
}

export interface PenjualanFilter {
  tanggal_awal?: string;
  tanggal_akhir?: string;
  id_user?: number;
  status?: 0 | 1;
}

export const penjualanService = {
  list: (filter?: PenjualanFilter) => get<Penjualan[]>('/penjualan', filter as Record<string, unknown>),
  getById: (id: number) => get<Penjualan>(`/penjualan/${id}`),
  checkout: (data: CheckoutInput) => post<CheckoutResult>('/penjualan/checkout', data),
  void: (id: number) => post(`/penjualan/${id}/void`),
};
