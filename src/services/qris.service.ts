import { get, putForm } from './api';
import type { Qris } from '@/types';

export interface QrisInput {
  merchant_name?: string;
  nmid?: string;
  is_active?: boolean;
}

// Bangun FormData (field teks + file gambar opsional) untuk multipart/form-data.
function toFormData(data: QrisInput, file?: File | null): FormData {
  const fd = new FormData();
  if (data.merchant_name !== undefined) fd.append('merchant_name', data.merchant_name ?? '');
  if (data.nmid !== undefined) fd.append('nmid', data.nmid ?? '');
  if (data.is_active !== undefined) fd.append('is_active', data.is_active ? 'true' : 'false');
  if (file) fd.append('image', file);
  return fd;
}

export const qrisService = {
  get: () => get<Qris>('/qris'),
  update: (data: QrisInput, file?: File | null) => putForm<Qris>('/qris', toFormData(data, file)),
};
