import { get, post, put, del } from './api';
import type { JenisBayar } from '@/types';

export const jenisBayarService = {
  list: () => get<JenisBayar[]>('/jenis-bayar'),
  create: (nama: string) => post<JenisBayar>('/jenis-bayar', { nama }),
  update: (id: number, nama: string) => put<JenisBayar>(`/jenis-bayar/${id}`, { nama }),
  remove: (id: number) => del(`/jenis-bayar/${id}`),
};
