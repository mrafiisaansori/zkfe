import { get, post, put, del } from './api';

export interface Supplier {
  ID: number;
  NAMA: string;
  ALAMAT?: string | null;
  NO_TELP?: string | null;
  EMAIL?: string | null;
  CATATAN?: string | null;
  STATUS?: number; // 1 aktif, 0 nonaktif
}

export interface SupplierInput {
  nama: string;
  no_telp?: string;
  email?: string;
  alamat?: string;
  catatan?: string;
  status?: 0 | 1;
}

export const supplierService = {
  list: (params?: { search?: string; status?: number | string }) =>
    get<Supplier[]>('/supplier', params as Record<string, unknown>),
  getById: (id: number) => get<Supplier>(`/supplier/${id}`),
  create: (data: SupplierInput) => post<Supplier>('/supplier', data),
  update: (id: number, data: Partial<SupplierInput>) => put<Supplier>(`/supplier/${id}`, data),
  remove: (id: number) => del(`/supplier/${id}`),
};
