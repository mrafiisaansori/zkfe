import { get, post, put, del } from './api';
import type { Kategori } from '@/types';

export const kategoriService = {
  list: () => get<Kategori[]>('/kategori'),
  create: (deskripsi: string) => post<Kategori>('/kategori', { deskripsi }),
  update: (id: number, deskripsi: string) => put<Kategori>(`/kategori/${id}`, { deskripsi }),
  remove: (id: number) => del(`/kategori/${id}`),
};
