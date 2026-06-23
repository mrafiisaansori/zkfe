import { get, post, put, del } from './api';

export interface PembelianItemInput {
  id_produk: number;
  harga_beli: number;
  qty: number;
}
export interface PembelianInput {
  no_nota: string;
  tanggal: string;
  id_supplier?: number | null;
  catatan?: string;
  items: PembelianItemInput[];
}

export interface PembelianDetail {
  ID: number;
  ID_PRODUK: number;
  HARGA_BELI: number;
  QTY: number;
  produk?: { ID: number; NAMA: string };
}
export interface Pembelian {
  ID: number;
  NO_NOTA: string;
  TANGGAL: string;
  STATUS: number; // 0 DRAFT, 1 SELESAI, 2 CANCELLED
  CATATAN?: string | null;
  ID_SUPPLIER?: number | null;
  supplier?: { ID: number; NAMA: string } | null;
  user?: { ID: number; NAMA: string } | null;
  detail?: PembelianDetail[];
}

export interface ListFilter {
  status?: number | string;
  tanggal_awal?: string;
  tanggal_akhir?: string;
  search?: string;
}

// merchant_id & id_user TIDAK dikirim frontend — backend ambil dari token.
export const pembelianService = {
  list: (filter?: ListFilter) => get<Pembelian[]>('/pembelian', filter as Record<string, unknown>),
  getById: (id: number) => get<Pembelian>(`/pembelian/${id}`),
  create: (data: PembelianInput) => post<{ id: number }>('/pembelian', data),
  update: (id: number, data: PembelianInput) => put<{ id: number }>(`/pembelian/${id}`, data),
  remove: (id: number) => del(`/pembelian/${id}`),
  selesaikan: (id: number) => post(`/pembelian/${id}/selesaikan`),
  batal: (id: number) => post(`/pembelian/${id}/batal`),
};
