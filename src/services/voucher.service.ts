import { get, post, put, del } from './api';
import type { Voucher } from '@/types';

export interface VoucherInput {
  kode: string;
  tipe: 'NOMINAL' | 'PERSEN';
  nilai: number;
  min_transaksi?: number;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active?: boolean;
}

export interface VoucherPreview {
  kode: string;
  tipe: 'NOMINAL' | 'PERSEN';
  nilai: number;
  diskon: number;
}

export const voucherService = {
  list: () => get<Voucher[]>('/voucher'),
  create: (data: VoucherInput) => post<Voucher>('/voucher', data),
  update: (id: number, data: Partial<VoucherInput>) => put<Voucher>(`/voucher/${id}`, data),
  remove: (id: number) => del(`/voucher/${id}`),
  // Validasi + pratinjau diskon untuk subtotal tertentu.
  validate: (kode: string, subtotal: number) =>
    get<VoucherPreview>('/voucher/validate', { kode, subtotal }),
};
