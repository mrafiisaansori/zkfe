import { get, post, put, del } from './api';
import type { ListFilter } from './pembelian.service';

export interface ReturItemInput {
  id_produk: number;
  qty: number;
  alasan?: string;
  kondisi?: string;
  harga?: number | null;
  keterangan?: string;
}
export interface ReturInput {
  no_nota: string;
  tanggal: string;
  id_supplier?: number | null;
  id_pembelian?: number | null;
  catatan?: string;
  items: ReturItemInput[];
}

export interface ReturDetail {
  ID: number;
  ID_PRODUK: number;
  QTY: number;
  ALASAN?: string | null;
  KONDISI?: string | null;
  HARGA?: number | null;
  produk?: { ID: number; NAMA: string; STOK?: number };
}
export interface Retur {
  ID: number;
  NO_NOTA: string;
  TANGGAL: string;
  STATUS: number; // 0 DRAFT, 1 SELESAI, 2 DIBATALKAN
  CATATAN?: string | null;
  ID_SUPPLIER?: number | null;
  ID_PEMBELIAN?: number | null;
  supplier?: { ID: number; NAMA: string } | null;
  pembelian?: { ID: number; NO_NOTA: string } | null;
  user?: { ID: number; NAMA: string } | null;
  detail?: ReturDetail[];
}

export const returService = {
  list: (filter?: ListFilter) => get<Retur[]>('/retur', filter as Record<string, unknown>),
  getById: (id: number) => get<Retur>(`/retur/${id}`),
  create: (data: ReturInput) => post<{ id: number }>('/retur', data),
  update: (id: number, data: ReturInput) => put<{ id: number }>(`/retur/${id}`, data),
  remove: (id: number) => del(`/retur/${id}`),
  selesaikan: (id: number) => post(`/retur/${id}/selesaikan`),
  batal: (id: number) => post(`/retur/${id}/batal`),
};
