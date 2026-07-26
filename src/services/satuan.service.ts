import { get, post, put, del } from './api';
import type { Satuan } from '@/types';

export const satuanService = {
  list: () => get<Satuan[]>('/satuan'),
  create: (nama: string) => post<Satuan>('/satuan', { nama }),
  update: (id: number, nama: string) => put<Satuan>(`/satuan/${id}`, { nama }),
  remove: (id: number) => del(`/satuan/${id}`),
};
